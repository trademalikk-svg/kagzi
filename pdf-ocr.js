(function(){
'use strict';
const cache=new Map();
const progressListeners=new Map();
const LANGUAGES=new Set(['eng','hin','urd','ben','mar','eng+hin','eng+hin+urd+ben+mar']);
function normalizeLanguage(language){
 const value=String(language||'eng').trim().toLowerCase();
 if(!LANGUAGES.has(value))throw new Error('Choose a supported OCR language: English, Hindi, Urdu, Bengali or Marathi.');
 return value;
}
function reportProgress(language,event){
 if(!event||event.status!=='recognizing text')return;
 const value=Math.max(0,Math.min(100,Math.round((Number(event.progress)||0)*100)));
 for(const listener of progressListeners.get(language)||[])listener(value);
}
async function workerFor(language,onProgress){
 if(!window.Tesseract)throw new Error('OCR engine did not load. Connect to the internet once and refresh.');
 const key=normalizeLanguage(language);
 const listeners=progressListeners.get(key)||new Set();
 if(typeof onProgress==='function')listeners.add(onProgress);
 progressListeners.set(key,listeners);
 if(!cache.has(key)){
  const promise=Promise.resolve().then(()=>window.Tesseract.createWorker(key,1,{logger:event=>reportProgress(key,event)}));
  cache.set(key,promise);
  promise.catch(()=>{if(cache.get(key)===promise)cache.delete(key);});
 }
 try{
  const worker=await cache.get(key);
  return {worker,release:()=>{listeners.delete(onProgress);if(!listeners.size)progressListeners.delete(key);}};
 }catch(error){
  listeners.delete(onProgress);
  if(!listeners.size)progressListeners.delete(key);
  throw error;
 }
}
async function recognize(source,language,onProgress){
 const session=await workerFor(language,onProgress);
 try{
  const result=await session.worker.recognize(source);
  const data=result&&result.data||{};
  return {text:data.text||'',confidence:Number(data.confidence)||0,words:(data.words||[]).map(word=>({text:word.text||'',confidence:Number(word.confidence)||0,bbox:word.bbox||null}))};
 }finally{session.release();}
}
window.KAGZIPdfOcr={
 languages:Array.from(LANGUAGES),
 async recognizeImage(file,language,onProgress){return recognize(file,language,onProgress);},
 async detectPageText({pageIndex,pdfDoc}){
  const page=await pdfDoc.getPage(pageIndex+1),viewport=page.getViewport({scale:1.6}),canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  const result=await recognize(canvas,document.getElementById('ocrLanguage')?.value||'eng',p=>{const status=document.getElementById('editorStatus');if(status)status.textContent='Local OCR running: '+p+'%';});
  return result.words.length?result.words.map(word=>({text:word.text,confidence:word.confidence/100,bbox:word.bbox})):result.text?[{text:result.text,confidence:result.confidence/100}]:[];
 }
};
window.KAGZIPdfOcrRecognize=recognize;
})();