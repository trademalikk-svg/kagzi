(function(){
'use strict';
const cache=new Map();
async function workerFor(language,onProgress){
 if(!window.Tesseract)throw new Error('OCR engine did not load. Connect to the internet once and refresh.');
 if(!cache.has(language)){
  const pending=Promise.resolve().then(async()=>{
   const worker=await window.Tesseract.createWorker(language,1,{logger:event=>{if(event.status==='recognizing text')onProgress(Math.round((event.progress||0)*100));}});
   if(typeof worker.setParameters==='function')await worker.setParameters({
    tessedit_pageseg_mode:'3',
    preserve_interword_spaces:'1',
    user_defined_dpi:'300'
   });
   return worker;
  });
  cache.set(language,pending);
 }
 const pending=cache.get(language);
 try{return await pending;}
 catch(error){if(cache.get(language)===pending)cache.delete(language);throw error;}
}
function normaliseOcrText(value){
 return String(value??'').replace(/\r\n?/g,'\n').normalize('NFC').replace(/[\t\f\v ]+/g,' ').replace(/ *\n */g,'\n').trim();
}
function ocrUnits(value){
 const text=normaliseOcrText(value);
 if(typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function')return [...new Intl.Segmenter('hi',{granularity:'grapheme'}).segment(text)].map(part=>part.segment);
 return Array.from(text);
}
function levenshtein(a,b){
 const previous=Array.from({length:b.length+1},(_,index)=>index);
 for(let i=1;i<=a.length;i++){
  let diagonal=previous[0];previous[0]=i;
  for(let j=1;j<=b.length;j++){
   const above=previous[j],cost=a[i-1]===b[j-1]?0:1;
   previous[j]=Math.min(previous[j]+1,previous[j-1]+1,diagonal+cost);diagonal=above;
  }
 }
 return previous[b.length];
}
function scoreOcrText(actual,reference){
 const actualText=normaliseOcrText(actual),referenceText=normaliseOcrText(reference);
 const actualChars=ocrUnits(actualText),referenceChars=ocrUnits(referenceText);
 const actualWords=actualText?actualText.split(/\s+/u):[],referenceWords=referenceText?referenceText.split(/\s+/u):[];
 const characterErrors=levenshtein(actualChars,referenceChars),wordErrors=levenshtein(actualWords,referenceWords);
 return {characterErrors,referenceCharacters:referenceChars.length,characterErrorRate:referenceChars.length?characterErrors/referenceChars.length:(actualChars.length?1:0),wordErrors,referenceWords:referenceWords.length,wordErrorRate:referenceWords.length?wordErrors/referenceWords.length:(actualWords.length?1:0)};
}
function enhancePage(source){
 const maxSide=4200,scale=Math.min(1.35,maxSide/Math.max(source.width,source.height));
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(source,0,0,canvas.width,canvas.height);
 const image=ctx.getImageData(0,0,canvas.width,canvas.height),data=image.data,w=canvas.width,h=canvas.height;
 const gray=new Uint8Array(w*h),integral=new Float64Array((w+1)*(h+1));
 for(let y=0;y<h;y++){
  let row=0;
  for(let x=0;x<w;x++){
   const i=(y*w+x)*4,g=Math.max(0,Math.min(255,Math.round(.299*data[i]+.587*data[i+1]+.114*data[i+2])));
   gray[y*w+x]=g;row+=g;integral[(y+1)*(w+1)+x+1]=integral[y*(w+1)+x+1]+row;
  }
 }
 const radius=Math.max(12,Math.round(Math.min(w,h)*.012)),stride=w+1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const x1=Math.max(0,x-radius),y1=Math.max(0,y-radius),x2=Math.min(w-1,x+radius),y2=Math.min(h-1,y+radius);
  const sum=integral[(y2+1)*stride+x2+1]-integral[y1*stride+x2+1]-integral[(y2+1)*stride+x1]+integral[y1*stride+x1];
  const mean=sum/((x2-x1+1)*(y2-y1+1)),value=gray[y*w+x];
  const ink=value<mean-9?0:255,i=(y*w+x)*4;
  data[i]=data[i+1]=data[i+2]=ink;data[i+3]=255;
 }
 ctx.putImageData(image,0,0);
 return canvas;
}
function errorMessage(error){
 const raw=String(error&&error.message||error||'unknown error');
 if(/fetch|network|download|traineddata|language data|http|cors/i.test(raw))return 'Could not load the selected OCR language data. Connect to the internet and retry; language data is downloaded free on first use.';
 if(/worker|wasm|script/i.test(raw))return 'The OCR engine could not start. Refresh the page and retry.';
 return raw;
}
async function recognize(source,language,onProgress){
 const worker=await workerFor(language,onProgress);
 const result=await worker.recognize(source);
 return {text:result.data.text||'',confidence:result.data.confidence||0,words:(result.data.words||[]).map(word=>({text:word.text,confidence:word.confidence,bbox:word.bbox}))};
}
window.KAGZIPdfOcr={
 async recognizeImage(file,language,onProgress){\n  if(typeof createImageBitmap!=='function')return recognize(file,language,onProgress);\n  let bitmap;try{bitmap=await createImageBitmap(file);const source=document.createElement('canvas');source.width=bitmap.width;source.height=bitmap.height;source.getContext('2d').drawImage(bitmap,0,0);return await recognize(enhancePage(source),language,onProgress);}catch(error){return recognize(file,language,onProgress);}finally{bitmap?.close?.();}\n },
 async detectPageText({pageIndex,pdfDoc}){
  const page=await pdfDoc.getPage(pageIndex+1),viewport=page.getViewport({scale:3}),canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d',{willReadFrequently:true}),viewport}).promise;
  const enhanced=enhancePage(canvas);
  const result=await recognize(enhanced,document.getElementById('ocrLanguage')?.value||'hin',p=>{const status=document.getElementById('editorStatus');if(status)status.textContent='Hindi OCR running on enhanced 300-DPI page: '+p+'%';});
  return result.words.length?result.words.map(word=>({text:word.text,confidence:word.confidence/100,bbox:word.bbox,ocrText:result.text})):result.text?[{text:result.text,confidence:result.confidence/100,ocrText:result.text}]:[];
 }
};
window.KAGZIPdfOcrRecognize=recognize;
window.KAGZIPdfOcrErrorMessage=errorMessage;
window.KAGZIPdfOcrScore=scoreOcrText;
window.KAGZIPdfOcrEnhancePage=enhancePage;
})();