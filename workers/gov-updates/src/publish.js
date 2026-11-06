export async function validateCandidate(candidate,source){
 const reasons=[];
 if(source.permission_status!=="approved"||!source.allow_republish||!source.allow_fetch)reasons.push("permission_not_approved");
 if(!source.permission_evidence||!source.terms_url||!source.attribution)reasons.push("permission_evidence_incomplete");
 if(!candidate.title||!candidate.officialUrl||!candidate.summary)reasons.push("required_source_fields_missing");
 try{const u=new URL(candidate.officialUrl);const s=new URL(source.source_url);if(u.protocol!=="https:")reasons.push("official_url_not_https");if(u.hostname!==s.hostname)reasons.push("official_url_host_mismatch");}catch{reasons.push("invalid_official_url");}
 if(candidate.ambiguous||candidate.conflicting||candidate.stale)reasons.push("candidate_requires_manual_review");
 return {publishable:reasons.length===0,reasons};
}
export async function publishCandidate(candidate,source,db,now=new Date()){
 const verdict=await validateCandidate(candidate,source);
 const existing=await db.prepare("SELECT id,title,summary FROM update_items WHERE source_id=? AND official_url=?").bind(source.id,candidate.officialUrl).first();
 if(existing&&existing.title===candidate.title&&existing.summary===candidate.summary)return {id:existing.id,duplicate:true,...verdict};
 const id=crypto.randomUUID();
 if(existing)await db.prepare("UPDATE update_items SET title=?,summary=?,published_at=?,source_checked_at=?,verification_status=?,is_published=?,withheld_reason=? WHERE id=?").bind(candidate.title,candidate.summary,now.toISOString(),candidate.checkedAt||now.toISOString(),verdict.publishable?"verified":"withheld",verdict.publishable?1:0,verdict.reasons.join(",")||null,existing.id).run();
 else await db.prepare("INSERT INTO update_items(id,source_id,category,region,title,summary,official_url,published_at,source_checked_at,verification_status,is_published,withheld_reason) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,source.id,candidate.category||source.category,candidate.region||source.region,candidate.title,candidate.summary,candidate.officialUrl,now.toISOString(),candidate.checkedAt||now.toISOString(),verdict.publishable?"verified":"withheld",verdict.publishable?1:0,verdict.reasons.join(",")||null).run();
 return {id:existing?.id||id,...verdict};
}
