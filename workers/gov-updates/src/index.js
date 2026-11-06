import {getApprovedSources,fetchPermittedSource} from "./ingest.js";
import {publishCandidate} from "./publish.js";
function decodeXml(s){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").trim();}
function tag(block,name){const m=block.match(new RegExp("<"+name+"[^>]*>([\\s\\S]*?)</"+name+">","i"));return m?decodeXml(m[1]).replace(/<[^>]*>/g," ").replace(/\\s+/g," ").trim():"";}
export function parseRssItems(xml,source,checkedAt){
 const items=[...xml.matchAll(/<item\\b[^>]*>([\\s\\S]*?)<\\/item>/gi)].map(m=>m[1]);
 return items.map(block=>({title:tag(block,"title"),summary:tag(block,"description").slice(0,1200),officialUrl:tag(block,"link"),category:source.category,region:source.region,checkedAt,ambiguous:false})).filter(x=>x.title&&x.summary&&x.officialUrl);
}
async function runScan(env){
 if(!env.DB)throw new Error("D1 binding DB is not configured; scheduled publishing remains disabled.");
 const sources=await getApprovedSources(env.DB),results=[];
 for(const source of sources){
  try{
   const fetched=await fetchPermittedSource(source);
   if(fetched.skipped){results.push({source:source.id,skipped:fetched.reason});continue;}
   const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(fetched.body));
   const hashHex=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
   const existing=await env.DB.prepare("SELECT id FROM source_snapshots WHERE source_id=? AND content_hash=?").bind(source.id,hashHex).first();
   if(existing){await env.DB.prepare("UPDATE sources SET last_checked_at=? WHERE id=?").bind(fetched.checkedAt,source.id).run();results.push({source:source.id,unchanged:true});continue;}
   const snapshotId=crypto.randomUUID();
   await env.DB.prepare("INSERT INTO source_snapshots(id,source_id,content_hash,payload_json,fetched_at) VALUES(?,?,?,?,?)").bind(snapshotId,source.id,hashHex,JSON.stringify({body:fetched.body}),fetched.checkedAt).run();
   let published=0,withheld=0;
   if(source.source_type==="rss"){
    for(const candidate of parseRssItems(fetched.body,source,fetched.checkedAt)){
     const result=await publishCandidate(candidate,source,env.DB);
     if(result.publishable&&!result.duplicate)published++;
     else if(!result.publishable)withheld++;
    }
   }
   await env.DB.prepare("UPDATE sources SET last_checked_at=? WHERE id=?").bind(fetched.checkedAt,source.id).run();
   results.push({source:source.id,changed:true,published,withheld,format:source.source_type});
  }catch(error){results.push({source:source.id,error:String(error.message||error)});}
 }
 return {checked:sources.length,results};
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/health")return Response.json({ok:true,service:"kagzi-government-updates",mode:env.DB?"configured":"disabled"});
  if(url.pathname==="/feed"){
   if(!env.DB)return Response.json({items:[],available:false});
   const {results=[]}=await env.DB.prepare("SELECT id,category,region,title,summary,official_url AS officialUrl,published_at AS publishedAt,source_checked_at AS checkedAt FROM update_items WHERE is_published=1 ORDER BY published_at DESC LIMIT 100").all();
   return Response.json({items:results,available:true},{headers:{"Cache-Control":"public, max-age=300"}});
  }
  return new Response("Not found",{status:404});
 },
 async scheduled(event,env,ctx){ctx.waitUntil(runScan(env));}
};
export {runScan};
