import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const BASE = process.env.SITE_URL || "https://kagzi-8cy.pages.dev";
const today = new Date().toISOString().slice(0,10);
const outDir = "docs/reports";
const keywordSeeds = [
  {keyword:"UP e-District services",intent:"official service guidance",page:"/jan-seva.html"},
  {keyword:"आय प्रमाणपत्र ऑनलाइन उत्तर प्रदेश",intent:"certificate guidance",page:"/jan-seva.html"},
  {keyword:"जाति प्रमाणपत्र कैसे बनवाएं",intent:"certificate guidance",page:"/jan-seva.html"},
  {keyword:"निवास प्रमाणपत्र ऑनलाइन UP",intent:"certificate guidance",page:"/jan-seva.html"},
  {keyword:"सरकारी दस्तावेज़ चेकलिस्ट",intent:"document preparation",page:"/gov-documents.html"},
  {keyword:"उत्तर प्रदेश सरकारी योजनाएँ",intent:"scheme discovery",page:"/jan-seva.html"},
  {keyword:"UP pension application information",intent:"welfare guidance",page:"/jan-seva.html"},
  {keyword:"UP Bhulekh khatauni",intent:"official land-record navigation",page:"/jan-seva.html"}
];
const competitors = JSON.parse(await readFile("docs/jan-seva-competitors.json","utf8"));
async function get(url) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),12000);
  try {
    const response = await fetch(url,{signal:controller.signal,headers:{"user-agent":"KAGZI-ResearchBot/1.0 (+https://kagzi-8cy.pages.dev/)"}});
    const html = (await response.text()).slice(0,500000);
    const meta = (pattern) => html.match(pattern)?.[1]?.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim().slice(0,240) || "";
    return {status:response.status,ok:response.ok,title:meta(/<title[^>]*>([\s\S]*?)<\/title>/i),description:meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)||meta(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),h1:meta(/<h1[^>]*>([\s\S]*?)<\/h1>/i),finalUrl:response.url};
  } catch(error) { return {status:0,ok:false,error:error.name==="AbortError"?"timeout":error.message}; }
  finally { clearTimeout(timer); }
}
const ownPaths=["/","/jan-seva.html","/gov-documents.html","/content-policy.html"];
const ownPages=[];
for (const path of ownPaths) {
  const page=await get(new URL(path,BASE).toString());
  ownPages.push({path,...page,hasTitle:Boolean(page.title),hasDescription:Boolean(page.description),hasH1:Boolean(page.h1)});
}
const sitemap=await get(new URL("/sitemap.xml",BASE).toString());
const competitorResults=[];
for (const item of competitors) competitorResults.push({name:item.name,url:item.url,...await get(item.url)});
const report={
  generatedAt:new Date().toISOString(),site:BASE,
  summary:{
    pagesChecked:ownPages.length,
    reachablePages:ownPages.filter(p=>p.ok).length,
    pagesWithTitle:ownPages.filter(p=>p.hasTitle).length,
    pagesWithDescription:ownPages.filter(p=>p.hasDescription).length,
    pagesWithH1:ownPages.filter(p=>p.hasH1).length,
    sitemapReachable:sitemap.ok,
    competitorSitesChecked:competitorResults.length,
    competitorSitesReachable:competitorResults.filter(p=>p.ok).length
  },
  ownPages,sitemap:{ok:sitemap.ok,status:sitemap.status},
  competitorResearch:competitorResults,
  keywordOpportunities:keywordSeeds,
  limitations:[
    "This is a technical SEO and public-page metadata watch, not a Google ranking or search-volume report.",
    "Competitor pages are checked for public title, description, H1 and reachability only; no private data or ranking positions are collected.",
    "Connect Google Search Console and provide query data to add impressions, clicks, CTR and average-position trends."
  ]
};
await mkdir(outDir,{recursive:true});
await writeFile(join(outDir,"latest.json"),JSON.stringify(report,null,2)+"\n");
await writeFile(join(outDir,today+".json"),JSON.stringify(report,null,2)+"\n");
let history=[];
try { history=JSON.parse(await readFile(join(outDir,"history.json"),"utf8")); if(!Array.isArray(history))history=[]; } catch {}
history=history.filter(x=>x.date!==today);
history.push({date:today,generatedAt:report.generatedAt,summary:report.summary});
history=history.sort((a,b)=>a.date.localeCompare(b.date)).slice(-90);
await writeFile(join(outDir,"history.json"),JSON.stringify(history,null,2)+"\n");
const lines=[
  "# KAGZI Jan Seva — Daily SEO & Competitor Report",
  "",
  "- Generated: "+report.generatedAt,
  "- Site: "+BASE,
  "",
  "## Technical SEO",
  "",
  "| Page | HTTP | Title | Description | H1 |",
  "|---|---:|---|---|---|",
  ...ownPages.map(p=>"| "+p.path+" | "+(p.status||"—")+" | "+(p.hasTitle?"Yes":"No")+" | "+(p.hasDescription?"Yes":"No")+" | "+(p.hasH1?"Yes":"No")+" |"),
  "",
  "Sitemap: "+(sitemap.ok?"reachable":"unavailable")+" (HTTP "+(sitemap.status||"—")+")",
  "",
  "## Public competitor/reference monitoring",
  "",
  "| Site | HTTP | Title | Description |",
  "|---|---:|---|---|",
  ...competitorResults.map(p=>"| ["+p.name+"]("+p.url+") | "+(p.status||"—")+" | "+(p.title||p.error||"—").replace(/\|/g,"/")+" | "+(p.description||"—").replace(/\|/g,"/")+" |"),
  "",
  "## Keyword opportunities (intent-led, not volume-ranked)",
  "",
  ...keywordSeeds.map(k=>"- **"+k.keyword+"** — "+k.intent+" — "+k.page),
  "",
  "## Measurement limits",
  "",
  ...report.limitations.map(x=>"- "+x),
  ""
];
await writeFile(join(outDir,"latest.md"),lines.join("\n"));
console.log(JSON.stringify(report.summary));
