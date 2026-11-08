(function(root){
'use strict';
let modulePromise=null;
const WASM_URL='/assets/kagzi-pdfium-native.wasm';
const ERROR_CODES={
  '-1':'Invalid input or unsupported Unicode.',
  '-2':'PDF could not be opened; it may be encrypted, damaged, or unsupported.',
  '-3':'The requested PDF page is unavailable.',
  '-4':'The exact complete text object was not found.',
  '-5':'The target text is ambiguous; no change was made.',
  '-6':'The target text object owner could not be verified.',
  '-7':'PDFium rejected the text replacement.',
  '-8':'Nested Form content could not be marked for regeneration.',
  '-9':'PDFium could not regenerate page content.',
  '-10':'PDFium could not save the edited PDF.'
};
function makeError(message,code){const error=new Error(message);error.code=code;return error;}
function load(){
  if(modulePromise)return modulePromise;
  const factory=root.KagziPdfiumModule;
  if(typeof factory!=='function')return Promise.reject(makeError('The browser PDFium WASM module is not loaded.','KAGZI_PDFIUM_RUNTIME_UNAVAILABLE'));
  modulePromise=Promise.resolve(factory({locateFile(path){return path.endsWith('.wasm')?WASM_URL:path;}})).catch(error=>{
    modulePromise=null;
    throw makeError('The browser PDFium runtime could not be initialized: '+(error&&error.message||'load failed'),'KAGZI_PDFIUM_RUNTIME_LOAD_FAILED');
  });
  return modulePromise;
}
function toCodePoints(value,label){
  if(typeof value!=='string'||!value.length)throw makeError(label+' must be a non-empty string.','KAGZI_PDFIUM_INVALID_TEXT');
  return Array.from(value,character=>character.codePointAt(0));
}
async function replaceText({bytes,pageIndex,targetText,replacement}){
  if(!(bytes instanceof Uint8Array)||!bytes.length)throw makeError('PDF bytes must be a non-empty Uint8Array.','KAGZI_PDFIUM_INVALID_PDF');
  if(!Number.isInteger(pageIndex)||pageIndex<0)throw makeError('Page index must be a zero-based non-negative integer.','KAGZI_PDFIUM_INVALID_PAGE');
  const target=toCodePoints(targetText,'Target text');
  const next=toCodePoints(replacement,'Replacement text');
  const module=await load();
  const allocations=[];
  const allocate=(length)=>{const pointer=module._malloc(length);if(!pointer)throw makeError('PDFium ran out of WASM memory.','KAGZI_PDFIUM_OUT_OF_MEMORY');allocations.push(pointer);return pointer;};
  let outputPointer=0;
  try{
    const pdfPointer=allocate(bytes.length);
    module.HEAPU8.set(bytes,pdfPointer);
    const targetPointer=allocate(target.length*4);
    module.HEAPU32.set(target,targetPointer>>>2);
    const replacementPointer=allocate(next.length*4);
    module.HEAPU32.set(next,replacementPointer>>>2);
    const outputPointerPointer=allocate(4);
    const outputSizePointer=allocate(4);
    module.HEAPU32[outputPointerPointer>>>2]=0;
    module.HEAPU32[outputSizePointer>>>2]=0;
    const result=module.ccall('kagzi_pdf_replace_text','number',
      ['number','number','number','number','number','number','number','number','number'],
      [pdfPointer,bytes.length,pageIndex,targetPointer,target.length,replacementPointer,next.length,outputPointerPointer,outputSizePointer]);
    if(result!==0)throw makeError(ERROR_CODES[String(result)]||('PDFium replacement failed with code '+result+'.'),'KAGZI_PDFIUM_REPLACEMENT_FAILED');
    outputPointer=module.HEAPU32[outputPointerPointer>>>2];
    const outputSize=module.HEAPU32[outputSizePointer>>>2];
    if(!outputPointer||!outputSize)throw makeError('PDFium returned an empty output document.','KAGZI_PDFIUM_EMPTY_OUTPUT');
    return module.HEAPU8.slice(outputPointer,outputPointer+outputSize);
  }finally{
    if(outputPointer&&typeof module._kagzi_pdf_free==='function')module._kagzi_pdf_free(outputPointer);
    for(let i=allocations.length-1;i>=0;i--)module._free(allocations[i]);
  }
}
const api=Object.freeze({
  status(){return Object.freeze({available:typeof root.KagziPdfiumModule==='function',engine:'PDFium WASM',runtimeUrl:WASM_URL});},
  load,
  replaceText
});
root.KAGZIPdfiumNativeEngine=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
