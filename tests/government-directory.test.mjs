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

test("unified State/UT jobs page has search, region filter, deadline sort and clear controls", async()=>{
 const html=await readFile(new URL("../government-jobs/states/index.html",import.meta.url),"utf8");
 for(const attr of ["data-search","data-region-filter","data-sort","data-clear","data-count","data-kagzi-directory"]) assert.match(html,new RegExp(attr));
 assert.match(html,/assets\/regions\.js/);
 assert.match(html,/assets\/jobs-directory\.js/);
 assert.match(html,/data-share-page/);
 assert.match(html,/data-whatsapp-page/);
 assert.doesNotMatch(html,/href="\.\.\/(?:andhra-pradesh|bihar|haryana|madhya-pradesh|punjab|rajasthan|uttar-pradesh)\/index\.html"/);
});

test("state recruitment registry contains only complete official-link records", async()=>{
 const raw=await readFile(new URL("../government-jobs/data/state-recruitments.json",import.meta.url),"utf8");
 const data=JSON.parse(raw);
 assert.ok(Array.isArray(data.items));
 for(const item of data.items){
  for(const key of ["id","regionSlug","regionName","department","title","sourceUrl","lastCheckedAt"]) assert.ok(item[key],key+" is required");
  assert.match(item.sourceUrl,/^https:\/\//);
  if(item.notificationUrl) assert.match(item.notificationUrl,/^https:\/\//);
  if(item.applyUrl) assert.match(item.applyUrl,/^https:\/\//);
  if(item.applyUrl) assert.ok(item.applyVerified===true,"Apply Online must be verified");
 }
});

test("unified jobs renderer supports region search, deadline sorting and safe share actions", async()=>{
 const js=await readFile(new URL("../government-jobs/assets/jobs-directory.js",import.meta.url),"utf8");
 assert.match(js,/KAGZI_REGIONS/);
 assert.match(js,/applicationEnd/);
 assert.match(js,/navigator\.share/);
 assert.match(js,/wa\.me/);
 assert.match(js,/clipboard\.writeText/);
 assert.match(js,/textContent/);
});

test("all State PSC portal links are attributed to the official UPPSC directory", async()=>{
 const raw=await readFile(new URL("../government-jobs/data/state-recruitments.json",import.meta.url),"utf8");
 const data=JSON.parse(raw);
 assert.equal(data.portals.length,29);
 assert.equal(new Set(data.portals.map(x=>x.regionSlug)).size,29);
 for(const portal of data.portals){
  assert.match(portal.url,/^https:\/\//);
  assert.equal(portal.sourceUrl,"https://uppsc.up.nic.in/OuterPages/Other_PSC.aspx");
  assert.ok(portal.lastCheckedAt);
 }
});

test("region filter is populated from the complete 36-region registry", async()=>{
 const raw=await readFile(new URL("../government-jobs/assets/regions.js",import.meta.url),"utf8");
 const match=raw.match(/window\.KAGZI_REGIONS=(\[[\s\S]*\]);/);
 const regions=JSON.parse(match[1]);
 const js=await readFile(new URL("../government-jobs/assets/jobs-directory.js",import.meta.url),"utf8");
 assert.equal(regions.length,36);
 assert.match(js,/regions\.forEach/);
 assert.match(js,/regionFilter\.append/);
 assert.match(js,/regionFilter\.value/);
});

test("Central Jobs shows official recruitment portals without mislabelling homepages as Apply Online", async()=>{
 const html=await readFile(new URL("../government-jobs/central/index.html",import.meta.url),"utf8");
 for(const host of ["ssc.gov.in","upsc.gov.in","rrbcdg.gov.in","ncs.gov.in","apprenticeshipindia.gov.in","ibps.in"]) assert.ok(html.includes(host),host+" official portal link");
 assert.match(html,/Official portal/);
 assert.match(html,/data-central-vacancies/);\n assert.match(html,/assets\\/central-jobs\\.js/);
 assert.match(html,/data-share-page/);
 assert.match(html,/data-whatsapp-page/);
});

test("Apply Online is shown only for a verified open vacancy and dates control all three statuses", async()=>{
 const js=await readFile(new URL("../government-jobs/assets/jobs-directory.js",import.meta.url),"utf8");
 assert.match(js,/item\.applyVerified===true/);
 assert.match(js,/status==="active"/);
 assert.match(js,/status==="upcoming"/);
 assert.match(js,/status==="inactive"/);
 assert.match(js,/applicationStart/);
 assert.match(js,/applicationEnd/);
 const central=await readFile(new URL("../government-jobs/assets/central-jobs.js",import.meta.url),"utf8");
 assert.match(central,/Apply Online/);
 assert.match(central,/x\.applyVerified===true/);
 assert.match(central,/status-upcoming/);
 assert.match(central,/status-inactive/);
});
