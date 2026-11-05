(function(){
'use strict';
let stream=null;
const byId=id=>document.getElementById(id);
function status(message){const node=byId('scannerStatus');if(node)node.textContent=message;}
async function openCamera(){
 const video=byId('cameraPreview');
 if(!navigator.mediaDevices?.getUserMedia){status('Camera API is unavailable. Open this page over HTTPS in a supported browser.');return;}
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=stream;video.hidden=false;await video.play();byId('captureScan').disabled=false;byId('closeCameraScanner').disabled=false;status('Camera ready. Place the page in view and tap Capture page.');}
 catch(error){status(error.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in browser settings.':'Could not open camera. Check camera availability and permissions.');}
}
function closeCamera(){if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;const video=byId('cameraPreview');if(video){video.pause();video.srcObject=null;video.hidden=true;}if(byId('captureScan'))byId('captureScan').disabled=true;if(byId('closeCameraScanner'))byId('closeCameraScanner').disabled=true;status('Camera closed.');}
async function capture(){
 const video=byId('cameraPreview'),canvas=byId('scanPreviewCanvas');if(!stream||!video.videoWidth){status('Open the camera first.');return;}
 const maxWidth=1800,scale=Math.min(1,maxWidth/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
 const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,canvas.width,canvas.height);
 // Basic document enhancement: grayscale and contrast; perspective crop remains a future enhancement.
 const frame=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=frame.data;
 for(let i=0;i<pixels.length;i+=4){const gray=.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2],enhanced=Math.max(0,Math.min(255,(gray-128)*1.12+128));pixels[i]=pixels[i+1]=pixels[i+2]=enhanced;}
 ctx.putImageData(frame,0,0);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));if(!blob){status('Could not capture this page.');return;}
 if(typeof window.KAGZIPdfEditorAppendScan!=='function'){status('PDF editor is still loading. Try again.');return;}
 const ok=await window.KAGZIPdfEditorAppendScan(blob);if(ok)status('Captured page added. You can scan another page or close the camera.');
}
function bind(){
 byId('openCameraScanner')?.addEventListener('click',openCamera);
 byId('closeCameraScanner')?.addEventListener('click',closeCamera);
 byId('captureScan')?.addEventListener('click',capture);
 byId('scanImageOcr')?.addEventListener('click',async()=>{
  const file=byId('ocrImageInput')?.files?.[0],language=byId('ocrLanguage')?.value||'eng',out=byId('ocrResults');
  if(!file){out.textContent='Choose an image first.';return;}
  try{out.textContent='Loading local OCR language data…';const result=await window.KAGZIPdfOcrRecognize(file,language,p=>out.textContent='Recognizing text locally: '+p+'%');out.textContent=result.text||'No readable text detected.';if(byId('inspectorText'))byId('inspectorText').value=result.text||'';}
  catch(error){out.textContent='OCR could not run: '+error.message;}
 });
 window.addEventListener('pagehide',closeCamera);
}
document.addEventListener('DOMContentLoaded',bind);
})();