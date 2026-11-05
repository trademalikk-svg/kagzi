(function(){
'use strict';
let stream=null,capturing=false;
const byId=id=>document.getElementById(id);
function status(message){const node=byId('scannerStatus');if(node)node.textContent=message;}
function ocrStatus(message){const node=byId('ocrEditStatus');if(node)node.textContent=message;}
function output(){return byId('ocrResults');}
function syncActions(){const hasText=!!(output()?.value||'').trim();['downloadOcrText','copyOcrText'].forEach(id=>{const node=byId(id);if(node)node.disabled=!hasText;});const addPage=byId('addOcrTextPage');if(addPage)addPage.disabled=!hasText||!window.KAGZIPdfEditorHasDocument?.();}
async function recognizeSource(source,label){
 const out=output();if(!out||typeof window.KAGZIPdfOcrRecognize!=='function'){ocrStatus('OCR engine is unavailable. Refresh after the OCR library loads.');return null;}
 const language=byId('ocrLanguage')?.value||'eng';
 try{
  out.value='';ocrStatus(label+' — loading local language data…');syncActions();
  const result=await window.KAGZIPdfOcrRecognize(source,language,p=>ocrStatus(label+' — recognizing locally: '+p+'%'));
  out.value=result.text||'';syncActions();
  ocrStatus(result.text?'OCR complete. Review and edit the recognized text below. Confidence: '+Math.round(result.confidence)+'%.':'No readable text was detected. Try better lighting or a clearer image.');
  const inspector=byId('inspectorText');if(inspector)inspector.value=result.text||'';
  return result;
 }catch(error){ocrStatus('OCR failed: '+(error.message||'unknown error'));return null;}
}
async function openCamera(){
 const video=byId('cameraPreview');
 if(!navigator.mediaDevices?.getUserMedia){status('Camera API is unavailable. Open this page over HTTPS in a supported browser.');return;}
 try{
  if(stream)closeCamera();
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
  video.srcObject=stream;video.hidden=false;await video.play();
  byId('captureScan').disabled=false;byId('closeCameraScanner').disabled=false;
  status('Camera ready. Place the page in view and tap Capture page.');
 }catch(error){
  if(stream)stream.getTracks().forEach(track=>track.stop());
  stream=null;if(video){video.srcObject=null;video.hidden=true;}
  if(byId('captureScan'))byId('captureScan').disabled=true;
  if(byId('closeCameraScanner'))byId('closeCameraScanner').disabled=true;
  status(error.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in browser settings.':'Could not open camera. Check camera availability and permissions.');
 }
}
function closeCamera(){if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;const video=byId('cameraPreview');if(video){video.pause();video.srcObject=null;video.hidden=true;}if(byId('captureScan'))byId('captureScan').disabled=true;if(byId('closeCameraScanner'))byId('closeCameraScanner').disabled=true;status('Camera closed.');}
async function capture(){
 const video=byId('cameraPreview'),canvas=byId('scanPreviewCanvas'),button=byId('captureScan');
 if(capturing)return;
 if(!stream||!video||!video.videoWidth){status('Open the camera first.');return;}
 capturing=true;if(button)button.disabled=true;
 try{
  const maxWidth=1800,scale=Math.min(1,maxWidth/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
  const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const frame=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=frame.data;
  for(let i=0;i<pixels.length;i+=4){const gray=.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2],enhanced=Math.max(0,Math.min(255,(gray-128)*1.12+128));pixels[i]=pixels[i+1]=pixels[i+2]=enhanced;}
  ctx.putImageData(frame,0,0);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));
  if(!blob)throw new Error('Could not capture this page.');
  if(typeof window.KAGZIPdfEditorAppendScan!=='function')throw new Error('PDF editor is still loading. Try again.');
  const ok=await window.KAGZIPdfEditorAppendScan(blob);
  if(ok){status('Captured page added to your PDF. Automatic OCR started.');await recognizeSource(blob,'Scanned page');}
 }catch(error){status(error.message||'Could not scan this page.');}
 finally{capturing=false;if(button)button.disabled=!stream;}
}
function downloadText(){const text=output()?.value||'';if(!text.trim())return;const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kagzi-ocr-text.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);ocrStatus('Edited OCR text downloaded.');}
async function copyText(){const text=output()?.value||'';if(!text.trim())return;try{await navigator.clipboard.writeText(text);ocrStatus('OCR text copied.');}catch(e){ocrStatus('Clipboard permission unavailable. Select and copy the text manually.');}}
function bind(){
 byId('openCameraScanner')?.addEventListener('click',openCamera);
 byId('closeCameraScanner')?.addEventListener('click',closeCamera);
 byId('captureScan')?.addEventListener('click',capture);
 byId('ocrImageInput')?.addEventListener('change',async event=>{const file=event.target.files?.[0];if(file)await recognizeSource(file,'Selected image');});
 byId('scanImageOcr')?.addEventListener('click',async()=>{const file=byId('ocrImageInput')?.files?.[0];if(file)await recognizeSource(file,'Selected image');else ocrStatus('Choose an image first.');});
 output()?.addEventListener('input',syncActions);
 byId('addOcrTextPage')?.addEventListener('click',async()=>{const text=output()?.value||'';if(!text.trim())return;if(typeof window.KAGZIPdfEditorAppendOcrText!=='function'){ocrStatus('PDF editor is not ready. Refresh and try again.');return;}try{ocrStatus('Adding OCR text to the open PDF…');await window.KAGZIPdfEditorAppendOcrText(text);ocrStatus('OCR text page added. It is a visual page image, not searchable text.');}catch(error){ocrStatus('Could not add OCR text page: '+(error.message||'operation failed'));}});
 byId('downloadOcrText')?.addEventListener('click',downloadText);
 byId('copyOcrText')?.addEventListener('click',copyText);
 window.addEventListener('pagehide',closeCamera);syncActions();
}
document.addEventListener('DOMContentLoaded',bind);
})();