(function(){
'use strict';
const cache=new Map();
async function workerFor(language,onProgress){
 if(!window.Tesseract)throw new Error('OCR engine did not load. Connect to the internet once and refresh.');
 if(!cache.has(language)){
  const promise=window.Tesseract.createWorker(language,1,{logger:event=>{if(event.status==='recognizing text'&&typeof onProgress==='function')onProgress(Math.round((event.progress||0)*100));}}).catch(error=>{cache.delete(language);throw error;});
  cache.set(language,promise);
 }
 return cache.get(language);
}
async function recognize(source,language,onProgress){
 const worker=await workerFor(language,onProgress);
 const result=await worker.recognize(source);
 return {text:result.data.text||'',confidence:result.data.confidence||0,words:(result.data.words||[]).map(word=>({text:word.text,confidence:word.confidence,bbox:word.bbox}))};
}
window.KAGZIPdfOcr={
 async recognizeImage(file,language,onProgress){return recognize(file,language,onProgress);},
 async detectPageText({pageIndex,pdfDoc}){
  const page=await pdfDoc.getPage(pageIndex+1),viewport=page.getViewport({scale:1.6}),canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  const result=await recognize(canvas,document.getElementById('ocrLanguage')?.value||'hin+eng',p=>{const status=document.getElementById('editorStatus');if(status)status.textContent='Local OCR running: '+p+'%';});
  return result.text?[{text:result.text,confidence:result.confidence/100,words:result.words}]:[];
 }
};
window.KAGZIPdfOcrRecognize=recognize;
})();