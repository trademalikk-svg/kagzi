import test from "node:test";
import assert from "node:assert/strict";
import {parseRssItems} from "../workers/gov-updates/src/index.js";
import {validateCandidate} from "../workers/gov-updates/src/publish.js";

const source={id:"sample",source_url:"https://example.gov.in/rss",source_type:"rss",category:"jobs",region:"central",permission_status:"approved",allow_fetch:1,allow_republish:1,permission_evidence:"Reviewed licence covering RSS republication",terms_url:"https://example.gov.in/terms",attribution:"Example Department"};
test("RSS parser extracts source title, summary and official URL",()=>{
 const xml="<rss><channel><item><title>Recruitment notice</title><link>https://example.gov.in/notice</link><description><![CDATA[Applications are open]]></description></item></channel></rss>";
 const [item]=parseRssItems(xml,source,"2026-11-06T00:00:00.000Z");
 assert.equal(item.title,"Recruitment notice");assert.equal(item.summary,"Applications are open");assert.equal(item.officialUrl,"https://example.gov.in/notice");assert.equal(item.category,"jobs");
});
test("unknown permission or cross-domain link is withheld",async()=>{
 const bad=await validateCandidate({title:"Notice",summary:"Details",officialUrl:"https://other.example/notice"},source);
 assert.equal(bad.publishable,false);assert.ok(bad.reasons.includes("official_url_host_mismatch"));
 const noPermission=await validateCandidate({title:"Notice",summary:"Details",officialUrl:"https://example.gov.in/notice"},{...source,permission_evidence:""});
 assert.equal(noPermission.publishable,false);assert.ok(noPermission.reasons.includes("permission_evidence_incomplete"));
});
test("ambiguous source changes are withheld",async()=>{
 const result=await validateCandidate({title:"Notice",summary:"Details",officialUrl:"https://example.gov.in/notice",ambiguous:true},source);
 assert.equal(result.publishable,false);assert.ok(result.reasons.includes("candidate_requires_manual_review"));
});
