(function(){
'use strict';
const PDFCANVAS_MODULE='https://esm.sh/pdfcanvas@0.9.0?bundle';
const PDFIUM_WASM='https://cdn.jsdelivr.net/npm/@embedpdf/pdfium@2.15.1/dist/pdfium.wasm';
let modulePromise=null;
function normalise(value){return String(value??'').normalize('NFC').replace(/\s+/gu,' ').trim();}
function overlapRatio(a,b){
 const width=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
 const height=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 const area=width*height,small=Math.min(a.w*a.h,b.w*b.h);
 return small>0?area/small:0;
}
function findExactRun(runs,originalText,rect){
 const target=normalise(originalText);
 const matches=(runs||[]).filter(run=>run&&run.editable&&normalise(run.text)===target);
 if(!matches.length)return null;
 if(matches.length===1)return matches[0];
 const ranked=matches.map(run=>({run,score:overlapRatio(rect,run)})).sort((a,b)=>b.score-a.score);
 return ranked[0].score>=.25?ranked[0].run:null;
}
async function loadModule(){
 if(!modulePromise)modulePromise=import(PDFCANVAS_MODULE).then(module=>{
  if(typeof module.PdfiumTextEngine!=='function')throw new Error('PDFium text engine export was not found.');
  return module.PdfiumTextEngine;
 }).catch(error=>{modulePromise=null;throw error;});
 return modulePromise;
}
async function replace({bytes,pageIndex,originalText,newText,rect}){
 if(!(bytes instanceof Uint8Array))throw new Error('PDF bytes are unavailable.');
 if(!String(newText||'').trim())throw new Error('Replacement text is empty.');
 if(normalise(originalText)===normalise(newText))throw new Error('The replacement text is unchanged.');
 const Engine=await loadModule();
 const engine=await Engine.create(PDFIUM_WASM,bytes.slice());
 try{
  const runs=engine.readPage(pageIndex,0);
  const run=findExactRun(runs,originalText,rect);
  if(!run)throw new Error('The selected text does not match one complete, editable PDF text object. Try selecting the whole text line.');
  const result=engine.applyEdits([{...run,newText:String(newText),originalText:run.text,background:'#ffffff'}]);
  if(result.failed?.length)throw new Error('PDFium could not safely replace this text with the available embedded font. Original PDF is unchanged.');
  if(!result.bytes||result.bytes.length<5||String.fromCharCode(...result.bytes.subarray(0,5))!=='%PDF-')throw new Error('PDFium returned an invalid PDF. Original PDF is unchanged.');
  return {bytes:result.bytes,originalText:run.text,newText:String(newText),fontName:run.fontName};
 }finally{engine.destroy();}
}
window.KAGZIPdfNativeText={replace,findExactRun,normalise};
})();