export async function getApprovedSources(db, now=new Date()) {
 const {results=[]}=await db.prepare("SELECT * FROM sources WHERE enabled=1 AND permission_status='approved' AND allow_fetch=1 AND allow_republish=1 AND review_due_at>?").bind(now.toISOString()).all();
 return results.filter(s=>s.permission_evidence&&s.terms_url&&s.attribution&&s.min_interval_minutes>=60);
}
export async function fetchPermittedSource(source, fetcher=fetch, now=new Date()) {
 const last=source.last_checked_at?Date.parse(source.last_checked_at):0;
 if(last&&now.getTime()-last<source.min_interval_minutes*60000) return {skipped:true,reason:"rate_limit"};
 if(!["rss","json_api","open_data_json"].includes(source.source_type)) return {skipped:true,reason:"unsupported_source_type"};
 const response=await fetcher(source.source_url,{headers:{"Accept":source.source_type==="rss"?"application/rss+xml, application/xml":"application/json","User-Agent":"KAGZI-Official-Info-Monitor/1.0"},signal:AbortSignal.timeout(12000),redirect:"error"});
 if(!response.ok) throw new Error("source_http_"+response.status);
 const body=await response.text();
 if(body.length>1000000) throw new Error("source_payload_too_large");
 if(source.source_type==="rss"&&!/<rss|<feed/i.test(body)) throw new Error("invalid_feed");
 if(source.source_type!=="rss"){const parsed=JSON.parse(body);if(!parsed||typeof parsed!=="object")throw new Error("invalid_json");}
 return {body,checkedAt:now.toISOString()};
}
