import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../functions/api/document-converter.js";

const pdf = new TextEncoder().encode("%PDF-1.7\\nmock");
const zip = new Uint8Array([0x50,0x4b,0x03,0x04,1,2,3,4]);
const jpg = new Uint8Array([0xff,0xd8,0xff,0xdb,0,1]);
const png = new Uint8Array([137,80,78,71,13,10,26,10,0]);
const plain = new TextEncoder().encode("hello,world");
const html = new TextEncoder().encode("<html><body>Hi</body></html>");
const run=(request,env,fetchImpl=fetch)=>handleRequest({request,env},fetchImpl);
function request({bytes=pdf,name="input.pdf",target="pdf-docx",consent="yes",origin="https://kagzi.test"}={}){
 const form=new FormData();form.append("file",new Blob([bytes]),name);form.append("target",target);form.append("consent",consent);
 return new Request("https://kagzi.test/api/document-converter",{method:"POST",headers:origin?{Origin:origin}:{},body:form});
}
const cases=[
 ["pdf-docx",pdf,"a.pdf","docx"],["pdf-jpg",pdf,"a.pdf","jpg"],["docx-pdf",zip,"a.docx","pdf"],
 ["pdf-txt",pdf,"a.pdf","txt"],["pdf-html",pdf,"a.pdf","html"],["jpg-png",jpg,"a.jpg","png"],
 ["png-jpg",png,"a.png","jpg"],["xlsx-csv",zip,"a.xlsx","csv"],["xlsx-pdf",zip,"a.xlsx","pdf"],
 ["pptx-pdf",zip,"a.pptx","pdf"],["pdf-pptx",pdf,"a.pdf","pptx"],["jpg-pdf",jpg,"a.jpg","pdf"],
 ["png-pdf",png,"a.png","pdf"],["txt-pdf",plain,"a.txt","pdf"],["html-pdf",html,"a.html","pdf"],
 ["csv-pdf",plain,"a.csv","pdf"]
];
test("requires consent and never forwards without it",async()=>{let called=false;const r=await run(request({consent:"no"}),{CONVERTAPI_TOKEN:"test"},async()=>{called=true;});assert.equal(r.status,400);assert.equal(called,false);});
test("rejects missing secret, cross-origin, and unsupported target",async()=>{
 assert.equal((await run(request(),{},fetch)).status,503);
 assert.equal((await run(request({origin:"https://evil.test"}),{CONVERTAPI_TOKEN:"x"})).status,403);
 assert.equal((await run(request({target:"pdf-zip"}),{CONVERTAPI_TOKEN:"x"})).status,400);
});
test("rejects mismatched extension and invalid file signature",async()=>{
 assert.equal((await run(request({name:"wrong.docx"}),{CONVERTAPI_TOKEN:"x"})).status,415);
 assert.equal((await run(request({bytes:new TextEncoder().encode("not pdf")}),{CONVERTAPI_TOKEN:"x"})).status,415);
});
for(const [target,bytes,name,outExt] of cases){
 test("supports "+target+" with expected output extension",async()=>{
  let calledUrl="";
  const r=await run(request({target,bytes,name}),{CONVERTAPI_TOKEN:"secret"},async(url,options)=>{
   calledUrl=String(url);assert.equal(options.headers.Authorization,"Bearer secret");
   assert.equal(options.body.get("StoreFile"),"true");
   return Response.json({Files:[{FileName:"converted."+outExt,Url:"https://v2.convertapi.com/d/job/converted."+outExt}]});
  });
  const data=await r.json();assert.equal(r.status,200);assert.equal(calledUrl,"https://v2.convertapi.com/convert/"+target.split("-")[0]+"/to/"+target.split("-")[1]);
  assert.equal(data.files[0].name,"converted."+outExt);
 });
}
test("rejects untrusted output host and wrong output extension",async()=>{
 for(const item of [
  {FileName:"x.docx",Url:"https://evil.test/x.docx"},
  {FileName:"x.txt",Url:"https://v2.convertapi.com/d/x/x.txt"}
 ]){
  const r=await run(request(),{CONVERTAPI_TOKEN:"x"},async()=>Response.json({Files:[item]}));
  assert.equal(r.status,502);
 }
});
test("maps upstream authentication, quota and invalid-input errors safely",async()=>{
 for(const [status,code] of [[401,"INVALID_CONVERTER_CREDENTIALS"],[403,"CONVERTER_QUOTA_OR_ACCESS"],[400,"INVALID_INPUT"]]){
  const r=await run(request(),{CONVERTAPI_TOKEN:"x"},async()=>new Response("private upstream detail",{status}));
  const data=await r.json();assert.equal(data.code,code);assert.equal(data.error.includes("private upstream"),false);
 }
});
test("rejects malformed upstream response and network failure",async()=>{
 const malformed=await run(request(),{CONVERTAPI_TOKEN:"x"},async()=>new Response("not json",{status:200}));
 assert.equal((await malformed.json()).code,"INVALID_CONVERSION_RESPONSE");
 const network=await run(request(),{CONVERTAPI_TOKEN:"x"},async()=>{throw new Error("offline");});
 assert.equal((await network.json()).code,"CONVERTAPI_UNAVAILABLE");
});
test("returns every trusted page image from a multi-page PDF conversion",async()=>{
 const r=await run(request({target:"pdf-jpg"}),{CONVERTAPI_TOKEN:"x"},async()=>Response.json({Files:[
  {FileName:"page-1.jpg",Url:"https://v2.convertapi.com/d/1/page-1.jpg"},
  {FileName:"page-2.jpg",Url:"https://v2.convertapi.com/d/2/page-2.jpg"}
 ]}));
 const data=await r.json();assert.equal(r.status,200);assert.equal(data.files.length,2);
});
