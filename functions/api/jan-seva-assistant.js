export async function onRequestPost({request,env}){
  const type=request.headers.get("content-type")||"";
  if(!type.includes("application/json"))return Response.json({error:"JSON request required."},{status:415});
  const declaredLength=Number(request.headers.get("content-length")||0);
  if(declaredLength>12000)return Response.json({error:"Request बहुत बड़ा है। कृपया छोटा सवाल भेजें।"},{status:413});
  let raw;try{raw=await request.text();}catch{return Response.json({error:"Invalid request."},{status:400});}
  if(new TextEncoder().encode(raw).byteLength>12000)return Response.json({error:"Request बहुत बड़ा है। कृपया छोटा सवाल भेजें।"},{status:413});
  let body;try{body=JSON.parse(raw);}catch{return Response.json({error:"Invalid request."},{status:400});}
  if(!body||typeof body!=="object"||Array.isArray(body))return Response.json({error:"Invalid request."},{status:400});
  const question=typeof body.question==="string"?body.question.trim():"";
  if(!question||question.length>1500)return Response.json({error:"सवाल 1 से 1500 अक्षरों के बीच लिखें।"},{status:400});
  const history=Array.isArray(body.history)?body.history.slice(-6).filter(item=>
    item&&["user","assistant"].includes(item.role)&&typeof item.content==="string"&&item.content.trim()&&item.content.length<=1500
  ).map(item=>({role:item.role,content:item.content.trim()})):[];
  const conversation=history.filter((item,index)=>!(index===history.length-1&&item.role==="user"&&item.content===question));
  if(!env.AI||typeof env.AI.run!=="function")return Response.json({error:"AI सुविधा अभी configure नहीं है। कृपया नीचे दी गई सेवा डायरेक्टरी और सरकारी लिंक इस्तेमाल करें।",code:"AI_NOT_CONFIGURED"},{status:503});
  const system=`You are KAGZI Jan Seva Assistant. Answer in the user's language (Hindi or English), in simple concise language. You provide general information only, not official legal, eligibility, financial, medical or government determinations. Never claim that KAGZI issues, approves, verifies or submits applications. Never invent fees, deadlines, eligibility, required documents or portal links. When uncertain, say so and direct the user to the relevant official department. You may mention these known official portals only when relevant: UP e-District https://edistrict.up.gov.in/ ; UP Food and Civil Supplies https://fcs.up.gov.in/ ; UP Social Welfare https://sspy-up.gov.in/ ; Civil Registration System https://crsorgi.gov.in/ ; National Scholarship Portal https://scholarships.gov.in/ ; PM-KISAN https://pmkisan.gov.in/ ; UP Bhulekh https://upbhulekh.gov.in/ ; National Career Service https://www.ncs.gov.in/ ; Election Commission https://voters.eci.gov.in/ ; Parivahan https://parivahan.gov.in/ . Do not ask for OTPs, passwords, payment PINs, full identity numbers, bank details or uploaded documents. If asked to apply on behalf of the user, explain that you only guide them and they must use the official portal themselves. For Uttar Pradesh sugarcane questions, explain these official Cane UP features when relevant: survey data, pre-calendar, cane calendar, additional satta calendar, standing cane calendar, supply ticket, current and previous cane weighment, SMS log, cane input availability, cane price information, machinery booking, complaint information, seed availability and weigh clerk posting. Official farmer enquiry portal: https://enquiry.caneup.in/ ; department portal: https://caneup.in/ ; e-Ganna app is published by UP Cooperative Cane Unions Federation Limited. The farmer must open the official portal/app to view their own records. Never claim you can retrieve private farmer records, change records, issue slips or submit complaints. Never ask for farmer code, OTP, password, full Aadhaar number or bank details in chat. Do not invent current crushing dates, prices, payment status, calendar dates, eligibility, fees or mill-specific schedules. Direct users to the official portal or their cane society for current details. Do not imply that portal links were checked live.`;
  try{
    const result=await env.AI.run("@cf/zai-org/glm-4.7-flash",{
      messages:[{role:"system",content:system},...conversation,{role:"user",content:question}],
      temperature:0.2,
      max_completion_tokens:650,
      chat_template_kwargs:{enable_thinking:false}
    });
    const replyCandidates=[
      result?.response,
      result?.choices?.[0]?.message?.content,
      result?.result?.response,
      result?.output_text,
      result?.text
    ];
    const reply=replyCandidates.find(value=>typeof value==="string"&&value.trim())?.trim()||"";
    if(!reply)return Response.json({error:"AI से उपयोगी जवाब नहीं मिला। कृपया थोड़ी देर बाद फिर कोशिश करें।",code:"AI_EMPTY_RESPONSE"},{status:502});
    return Response.json({reply},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    return Response.json({error:"AI सेवा अभी उपलब्ध नहीं है। कृपया सेवा डायरेक्टरी के आधिकारिक लिंक इस्तेमाल करें।",code:"AI_REQUEST_FAILED"},{status:502});
  }
}