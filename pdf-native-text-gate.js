(function(root){
'use strict';
const ENGINE_ERROR='Native PDF text editing needs the published PDFium WASM runtime and PDF.js.';
function failure(message,code){const error=new Error(message);error.code=code;return error;}
function getPageText(pdfjsLib,bytes,pageIndex){
 return pdfjsLib.getDocument({data:bytes.slice()}).promise.then(async doc=>{
  try{
   if(!Number.isInteger(pageIndex)||pageIndex<0||pageIndex>=doc.numPages)throw failure('The selected PDF page is unavailable.','KAGZI_NATIVE_TEXT_INVALID_PAGE');
   const page=await doc.getPage(pageIndex+1),content=await page.getTextContent();
   return (content.items||[]).filter(item=>typeof item.str==='string'&&item.str.length).map(item=>item.str);
  }finally{if(typeof doc.destroy==='function')await doc.destroy();}
 });
}
const api=Object.freeze({
 status(){
  const engine=root&&root.KAGZIPdfiumNativeEngine,available=!!(engine&&engine.status&&engine.status().available&&root.pdfjsLib&&typeof root.pdfjsLib.getDocument==='function');
  return Object.freeze({available,enabled:available,engine:'KAGZI PDFium WASM',reason:available?'Exact-match native editing with Save/Reopen verification is available.':ENGINE_ERROR});
 },
 async replaceText({bytes,pageIndex,targetText,replacement}){
  const engine=root&&root.KAGZIPdfiumNativeEngine,pdfjsLib=root&&root.pdfjsLib;
  if(!engine||!engine.status||!engine.status().available||!pdfjsLib||typeof pdfjsLib.getDocument!=='function')throw failure(ENGINE_ERROR,'KAGZI_NATIVE_TEXT_RUNTIME_UNAVAILABLE');
  if(!(bytes instanceof Uint8Array)||!bytes.length)throw failure('Open a valid PDF before native text editing.','KAGZI_NATIVE_TEXT_INVALID_PDF');
  if(!Number.isInteger(pageIndex)||pageIndex<0)throw failure('The selected PDF page is invalid.','KAGZI_NATIVE_TEXT_INVALID_PAGE');
  if(typeof targetText!=='string'||!targetText.length||typeof replacement!=='string'||!replacement.length)throw failure('Select a complete text item and enter replacement text.','KAGZI_NATIVE_TEXT_INVALID_TEXT');
  if(targetText===replacement)throw failure('Replacement text is unchanged.','KAGZI_NATIVE_TEXT_UNCHANGED');
  const before=await getPageText(pdfjsLib,bytes,pageIndex);
  const targetCount=before.filter(text=>text===targetText).length;
  const replacementCount=before.filter(text=>text===replacement).length;
  if(targetCount!==1||replacementCount!==0)throw failure('PDF.js could not identify one unique, complete text item. No changes were made.','KAGZI_NATIVE_TEXT_PDFJS_MATCH_NOT_UNIQUE');
  const output=await engine.replaceText({bytes:bytes.slice(),pageIndex,targetText,replacement});
  if(!(output instanceof Uint8Array)||!output.length)throw failure('PDFium returned no edited PDF bytes.','KAGZI_NATIVE_TEXT_EMPTY_OUTPUT');
  let after;
  try{after=await getPageText(pdfjsLib,output,pageIndex);}catch(error){throw failure('The edited PDF could not be reopened for verification: '+(error.message||'invalid PDF'),'KAGZI_NATIVE_TEXT_SAVE_REOPEN_FAILED');}
  const remainingTargets=after.filter(text=>text===targetText).length;
  const replacementMatches=after.filter(text=>text===replacement).length;
  if(remainingTargets!==0||replacementMatches!==1)throw failure('Save/Reopen verification did not confirm the exact replacement. The edited bytes were rejected.','KAGZI_NATIVE_TEXT_SAVE_REOPEN_FAILED');
  return Object.freeze({bytes:output,verification:Object.freeze({savedAndReopened:true,pageIndex,targetText,replacement})});
 }
});
if(root)root.KAGZIPdfNativeText=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
