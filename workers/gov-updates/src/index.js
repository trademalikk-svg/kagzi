import {getApprovedSources,fetchPermittedSource} from "./ingest.js";
import {publishCandidate} from "./publish.js";
async function runScan(env){
 if(!env.DB)throw new Error("D1 binding DB is not configured; scheduled publishing remains disabled.");
 const sources=await getApprovedSources(env.DB);
 const results=[];
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
   await env.DB.prepare("UPDATE sources SET last_checked_at=? WHERE id=?").bind(fetched.checkedAt,source.id).run();
   // Source-specific parsers are intentionally not generic: unknown formats are retained as snapshots, never auto-published.
   results.push({source:source.id,changed:true,publication:"withheld_no_approved_parser"});
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
