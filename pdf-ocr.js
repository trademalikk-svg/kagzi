(function(){
'use strict';
const cache=new Map();
async function workerFor(language,onProgress){
 if(!window.Tesseract)throw new Error('OCR engine did not load. Connect to the internet once and refresh.');
 if(!cache.has(language)){
  const pending=Promise.resolve().then(()=>window.Tesseract.createWorker(language,1,{logger:event=>{if(event.status==='recognizing text')onProgress(Math.round((event.progress||0)*100));}}));
  cache.set(language,pending);
 }
 const pending=cache.get(language);
 try{return await pending;}
 catch(error){if(cache.get(language)===pending)cache.delete(language);throw error;}
}

function normaliseOcrText(value){
 return String(value??'').replace(/\\r\\n?/g,'\\n').normalize('NFC').replace(/[\\t\\f\\v ]+/g,' ').replace(/ *\\n */g,'\\n').trim();
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
 const actualWords=actualText?actualText.split(/\\s+/u):[],referenceWords=referenceText?referenceText.split(/\\s+/u):[];
 const characterErrors=levenshtein(actualChars,referenceChars),wordErrors=levenshtein(actualWords,referenceWords);
 return {characterErrors,referenceCharacters:referenceChars.length,characterErrorRate:referenceChars.length?characterErrors/referenceChars.length:(actualChars.length?1:0),wordErrors,referenceWords:referenceWords.length,wordErrorRate:referenceWords.length?wordErrors/referenceWords.length:(actualWords.length?1:0)};
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
 async recognizeImage(file,language,onProgress){return recognize(file,language,onProgress);},
 async detectPageText({pageIndex,pdfDoc}){
  const page=await pdfDoc.getPage(pageIndex+1),viewport=page.getViewport({scale:1.6}),canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  const result=await recognize(canvas,document.getElementById('ocrLanguage')?.value||'hin',p=>{const status=document.getElementById('editorStatus');if(status)status.textContent='Local OCR running: '+p+'%';});
  return result.words.length?result.words.map(word=>({text:word.text,confidence:word.confidence/100,bbox:word.bbox})):result.text?[{text:result.text,confidence:result.confidence/100}]:[];
 }
};
window.KAGZIPdfOcrRecognize=recognize;
window.KAGZIPdfOcrErrorMessage=errorMessage;
window.KAGZIPdfOcrScore=scoreOcrText;
})();