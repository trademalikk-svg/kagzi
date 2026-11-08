const MAX_FILE_BYTES = 10 * 1024 * 1024;
const CONVERSIONS = {
  "pdf-docx": ["pdf","docx","pdf",["docx"]],
  "pdf-jpg": ["pdf","jpg","pdf",["jpg"]],
  "docx-pdf": ["docx","pdf","docx",["pdf"]],
  "pdf-txt": ["pdf","txt","pdf",["txt"]],
  "pdf-html": ["pdf","html","pdf",["html"]],
  "jpg-png": ["jpg","png","jpg",["png"]],
  "png-jpg": ["png","jpg","png",["jpg"]],
  "xlsx-csv": ["xlsx","csv","xlsx",["csv"]],
  "pptx-pdf": ["pptx","pdf","pptx",["pdf"]],
  "pdf-pptx": ["pdf","pptx","pdf",["pptx"]],
  "jpg-pdf": ["jpg","pdf","jpg",["pdf"]],
  "png-pdf": ["png","pdf","png",["pdf"]],
  "txt-pdf": ["txt","pdf","txt",["pdf"]],
  "html-pdf": ["html","pdf","html",["pdf"]],
  "csv-pdf": ["csv","pdf","csv",["pdf"]],
  "xlsx-pdf": ["xlsx","pdf","xlsx",["pdf"]]
};
function json(data,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}});}
function safeName(value,fallback){const base=String(value||fallback).split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,100);return base||fallback;}
function validSignature(bytes,ext){
 if(ext==="pdf")return bytes.length>=5&&new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
 if(["docx","xlsx","pptx"].includes(ext))return bytes.length>=4&&bytes[0]===0x50&&bytes[1]===0x4b&&[3,5,7].includes(bytes[2])&&[4,6,8].includes(bytes[3]);
 if(ext==="jpg")return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(ext==="png")return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(ext==="txt"||ext==="csv"||ext==="html")return bytes.length>0&&!bytes.slice(0,Math.min(bytes.length,4096)).some(v=>v===0);
 return false;
}
export async function handleRequest({request,env},fetchImpl=fetch){
 if(request.method!=="POST")return json({error:"केवल POST request स्वीकार है।"},405);
 const origin=request.headers.get("Origin");
 if(origin&&origin!==new URL(request.url).origin)return json({error:"Cross-origin request स्वीकार नहीं है।"},403);
 if(!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data"))return json({error:"कृपया फ़ाइल multipart form के रूप में भेजें।"},415);
 const declared=Number(request.headers.get("content-length")||0);
 if(declared>MAX_FILE_BYTES+256*1024)return json({error:"फ़ाइल 10 MB से छोटी होनी चाहिए।"},413);
 if(!env.CONVERTAPI_TOKEN)return json({error:"Converter अभी configure नहीं है। Admin को CONVERTAPI_TOKEN secret जाँचना होगा।",code:"CONVERTER_NOT_CONFIGURED"},503);
 let form;try{form=await request.formData();}catch{return json({error:"फ़ाइल request पढ़ी नहीं जा सकी।"},400);}
 if(form.get("consent")!=="yes")return json({error:"फ़ाइल भेजने से पहले आपकी सहमति आवश्यक है।"},400);
 const spec=CONVERSIONS[String(form.get("target")||"")];
 if(!spec)return json({error:"यह conversion विकल्प उपलब्ध नहीं है।"},400);
 const [from,to,inputExt,outputExts]=spec,file=form.get("file");
 if(!file||typeof file.arrayBuffer!=="function"||typeof file.name!=="string")return json({error:"कृपया सही फ़ाइल चुनें।"},400);
 if(file.size<1||file.size>MAX_FILE_BYTES)return json({error:"फ़ाइल 1 byte से 10 MB के बीच होनी चाहिए।"},413);
 const ext=file.name.toLowerCase().split(".").pop();
 if(ext!==inputExt)return json({error:"चुने गए conversion के लिए सही फ़ाइल format चुनें।"},415);
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!validSignature(bytes,ext))return json({error:"फ़ाइल का वास्तविक format मान्य नहीं है।"},415);
 const body=new FormData();
 body.append("File",new Blob([bytes],{type:({pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",jpg:"image/jpeg",png:"image/png",txt:"text/plain",csv:"text/csv",html:"text/html"})[ext]}),safeName(file.name,"document."+ext));
 body.append("StoreFile","true");
 // PDF to editable Word: flowing layout keeps text editable; Auto OCR handles scanned pages when supported.
 if(from==="pdf"&&to==="docx"){
  body.append("Layout","flowing");
  body.append("OcrMode","auto");
  body.append("OcrLanguage","auto");
  body.append("OcrEngine","native");
 }
 let upstream;
 try{upstream=await fetchImpl("https://v2.convertapi.com/convert/"+from+"/to/"+to,{method:"POST",headers:{Authorization:"Bearer "+env.CONVERTAPI_TOKEN},body,signal:AbortSignal.timeout(120000)});}
 catch{return json({error:"Conversion सेवा से संपर्क नहीं हो पाया। कृपया बाद में कोशिश करें।",code:"CONVERTAPI_UNAVAILABLE"},502);}
 if(!upstream.ok){
  const status=upstream.status;
  if(status===401)return json({error:"Converter credentials स्वीकार नहीं हुए। Admin को Secret जाँचना होगा।",code:"INVALID_CONVERTER_CREDENTIALS"},502);
  if(status===403)return json({error:"ConvertAPI account की अनुमति या उपलब्ध quota जाँचनी होगी।",code:"CONVERTER_QUOTA_OR_ACCESS"},502);
  if(status===400)return json({error:"यह फ़ाइल conversion सेवा ने स्वीकार नहीं की। फ़ाइल या format जाँचें।",code:"INVALID_INPUT"},422);
  return json({error:"Conversion सेवा ने अनुरोध पूरा नहीं किया। कुछ देर बाद कोशिश करें।",code:"CONVERSION_FAILED"},502);
 }
 let result;try{result=await upstream.json();}catch{return json({error:"Conversion सेवा से मान्य परिणाम नहीं मिला।",code:"INVALID_CONVERSION_RESPONSE"},502);}
 const files=Array.isArray(result?.Files)?result.Files:[];
 const outputs=files.filter(item=>typeof item?.Url==="string"&&(()=>{try{const u=new URL(item.Url);return u.protocol==="https:"&&u.hostname==="v2.convertapi.com";}catch{return false;}})()&&outputExts.includes(String(item.FileName||"").toLowerCase().split(".").pop())).map(item=>({name:safeName(item.FileName,"converted."+outputExts[0]),url:item.Url}));
 if(!outputs.length)return json({error:"Conversion पूरी नहीं हुई या सुरक्षित download link नहीं मिला।",code:"NO_OUTPUT_FILES"},502);
 return json({files:outputs,expiresInHours:3,message:"Conversion पूरी हुई। Download link अधिकतम 3 घंटे उपलब्ध रहेगा।"});
}
export async function onRequestPost(context){return handleRequest(context);}
