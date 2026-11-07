import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseRssItems} from "../workers/gov-updates/src/index.js";
import {validateCandidate} from "../workers/gov-updates/src/publish.js";

test("jobs directory contains all 28 states and 8 UT pages", async()=>{
 const raw=await readFile(new URL("../government-jobs/assets/regions.js",import.meta.url),"utf8");
 const match=raw.match(/window\.KAGZI_REGIONS=(\[[\s\S]*\]);/);
 assert.ok(match,"region registry exists");
 const regions=JSON.parse(match[1]);
 assert.equal(regions.filter(x=>x[3]==="state").length,28);
 assert.equal(regions.filter(x=>x[3]==="ut").length,8);
 assert.equal(new Set(regions.map(x=>x[0])).size,36);
 for(const [slug] of regions)assert.ok(await readFile(new URL("../government-jobs/"+slug+"/index.html",import.meta.url),"utf8"));
});

test("RSS parser extracts title, summary and official link",()=>{
 const xml="<rss><channel><item><title>Recruitment notice</title><link>https://example.gov.in/notice</link><description><![CDATA[Applications are open]]></description></item></channel></rss>";
 const [item]=parseRssItems(xml,{category:"jobs",region:"central"},"2026-11-06T00:00:00.000Z");
 assert.equal(item.title,"Recruitment notice");
 assert.equal(item.summary,"Applications are open");
 assert.equal(item.officialUrl,"https://example.gov.in/notice");
 assert.equal(item.category,"jobs");
});

test("permission-incomplete and cross-domain items are withheld",async()=>{
 const base={permission_status:"approved",allow_fetch:1,allow_republish:1,permission_evidence:"documented",terms_url:"https://example.gov.in/terms",attribution:"Example Dept",source_url:"https://example.gov.in/rss"};
 const candidate={title:"Notice",summary:"Details",officialUrl:"https://other.example/notice"};
 const result=await validateCandidate(candidate,base);
 assert.equal(result.publishable,false);
 assert.ok(result.reasons.includes("official_url_host_mismatch"));
 const noPermission=await validateCandidate({...candidate,officialUrl:"https://example.gov.in/notice"},{...base,permission_evidence:""});
 assert.equal(noPermission.publishable,false);
 assert.ok(noPermission.reasons.includes("permission_evidence_incomplete"));
});

test("ambiguous feed candidates are withheld",async()=>{
 const source={permission_status:"approved",allow_fetch:1,allow_republish:1,permission_evidence:"approved terms",terms_url:"https://example.gov.in/terms",attribution:"Example Dept",source_url:"https://example.gov.in/rss"};
 const result=await validateCandidate({title:"Notice",summary:"Details",officialUrl:"https://example.gov.in/notice",ambiguous:true},source);
 assert.equal(result.publishable,false);
 assert.ok(result.reasons.includes("candidate_requires_manual_review"));
});

test("Government Jobs landing page exposes only Central and one shared State/UT destination", async()=>{
 const html=await readFile(new URL("../government-jobs/index.html",import.meta.url),"utf8");
 assert.match(html,/href="central\/index\.html"/);
 assert.match(html,/href="states\/index\.html"/);
 assert.doesNotMatch(html,/href="(?:andhra-pradesh|arunachal-pradesh|assam|bihar|chhattisgarh|goa|gujarat|haryana|himachal-pradesh|jharkhand|karnataka|kerala|madhya-pradesh|maharashtra|manipur|meghalaya|mizoram|nagaland|odisha|punjab|rajasthan|sikkim|tamil-nadu|telangana|tripura|uttar-pradesh|uttarakhand|west-bengal|delhi|ladakh|puducherry)\/index\.html"/);
 assert.match(html,/data-kagzi-protected="true"/);
});
