(function(){
'use strict';
const byId=id=>document.getElementById(id);
let enabled=false,selected=null,items=[];
function hint(message){const n=byId('nativeTextHint');if(n)n.textContent=message;}
function clearSelection(){selected=null;document.querySelectorAll('.pdf-text-hit.selected').forEach(n=>n.classList.remove('selected'));const apply=byId('applyNativeTextEdit');if(apply)apply.disabled=true;}
function setSelection(item,node){
 clearSelection();selected=item;node.classList.add('selected');
 byId('nativeTextValue').value=item.text;
 byId('nativeTextSize').value=String(Math.max(6,Math.min(72,Math.round(item.height/item.scale*.82))));
 byId('applyNativeTextEdit').disabled=false;
 hint('Selected text block. Edit its wording and apply the replacement.');
}
async function renderTextLayer(){
 const api=window.KAGZIPdfEditorApi,doc=api?.getDocument(),layer=byId('pdfTextLayer');
 if(!doc||!layer)return;
 layer.replaceChildren();clearSelection();items=[];
 if(!enabled){hint('Tap Edit PDF text, then select a text block on the page.');return;}
 const index=api.getPageIndex(),page=await doc.getPage(index+1),scale=Number(window.__kagziEditorZoom)||1;
 const canvas=byId('pdfCanvas'),cssWidth=parseFloat(canvas.style.width)||canvas.clientWidth,cssHeight=parseFloat(canvas.style.height)||canvas.clientHeight;
 const viewport=page.getViewport({scale:1});
 const content=await page.getTextContent();
 for(const item of content.items){
  if(!item.str||!item.str.trim()||!item.transform)continue;
  const tx=window.pdfjsLib.Util.transform(page.getViewport({scale:scale}).transform,item.transform);
  const height=Math.max(8,Math.hypot(tx[2],tx[3]));
  const left=tx[4],top=tx[5]-height,width=Math.max(8,item.width*scale);
  if(left<0||top<0||left>cssWidth||top>cssHeight)continue;
  const node=document.createElement('button');node.type='button';node.className='pdf-text-hit';node.style.left=left+'px';node.style.top=top+'px';node.style.width=Math.min(width,cssWidth-left)+'px';node.style.height=height+'px';node.title='Edit: '+item.str;node.setAttribute('aria-label','Edit text: '+item.str);node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setSelection({text:item.str,left,top,width,height,scale,pageIndex:index,pageWidth:viewport.width,pageHeight:viewport.height},node);});
  layer.append(node);
 }
 if(!layer.childElementCount){
  hint('Scanned page detected. Running OCR to create selectable text regions…');
  try{
   const result=await window.KAGZIPdfEditorApi.detectPageText(index),ocrScale=1.6;
   for(const region of (result.regions||[])){
    const b=region.bbox;if(!b||!region.text)continue;
    const left=b.x0/ocrScale*scale,top=b.y0/ocrScale*scale,width=Math.max(8,(b.x1-b.x0)/ocrScale*scale),height=Math.max(8,(b.y1-b.y0)/ocrScale*scale);
    const node=document.createElement('button');node.type='button';node.className='pdf-text-hit';node.style.left=left+'px';node.style.top=top+'px';node.style.width=width+'px';node.style.height=height+'px';node.title='OCR: '+region.text;node.setAttribute('aria-label','Edit OCR text: '+region.text);
    node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setSelection({text:region.text,left,top,width,height,scale,pageIndex:index,pageWidth:viewport.width,pageHeight:viewport.height,ocr:true},node);});layer.append(node);
   }
   hint(layer.childElementCount?'OCR text blocks detected: '+layer.childElementCount+'. Tap a word to edit it.':'OCR did not find selectable words. Try a clearer scan.');
  }catch(error){hint('OCR could not create selectable regions: '+(error.message||'unknown error'));}
 }else hint('Text blocks detected: '+layer.childElementCount+'. Tap any block to edit it.');
}
async function applyReplacement(){
 const api=window.KAGZIPdfEditorApi;if(!api||!selected)return;
 const value=byId('nativeTextValue').value.trim();if(!value){hint('Enter replacement text first.');return;}
 const apply=byId('applyNativeTextEdit');apply.disabled=true;hint('Applying replacement locally…');
 try{
  const bytes=api.getBytes(),pdf=await window.PDFLib.PDFDocument.load(bytes),page=pdf.getPage(selected.pageIndex),pageSize=page.getSize();
  const zoom=selected.scale||1,x=selected.left/zoom,y=pageSize.height-(selected.top+selected.height)/zoom;
  const w=Math.min(selected.width/zoom,pageSize.width-x),h=Math.min(selected.height/zoom,pageSize.height-y);
  const canvas=byId('pdfCanvas'),ctx=canvas.getContext('2d'),ratio=canvas.width/(parseFloat(canvas.style.width)||canvas.clientWidth);
  const sx=Math.max(0,Math.min(canvas.width-1,Math.round((selected.left+selected.width/2)*ratio))),sy=Math.max(0,Math.min(canvas.height-1,Math.round((selected.top+selected.height/2)*ratio)));
  const pixel=ctx.getImageData(sx,sy,1,1).data,background=window.PDFLib.rgb(pixel[0]/255,pixel[1]/255,pixel[2]/255);
  const hex=(byId('nativeTextColor').value||'#17233c').slice(1),color=window.PDFLib.rgb(parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255);
  const fontSize=Math.max(6,Math.min(72,Number(byId('nativeTextSize').value)||selected.height/zoom*.82));
  const font=await pdf.embedFont(window.PDFLib.StandardFonts.Helvetica);
  // This is a visual replacement: the old glyphs are covered, then new text is drawn.
  page.drawRectangle({x:Math.max(0,x-1),y:Math.max(0,y-1),width:Math.max(4,w+2),height:Math.max(4,h+2),color:background,borderWidth:0});
  page.drawText(value,{x:Math.max(0,x),y:Math.max(0,y),size:fontSize,font,color,maxWidth:Math.max(12,w*1.8),lineHeight:fontSize*1.15});
  api.remember();window.KAGZIPdfEditorApi.setStatus('Text replacement applied locally. Review layout before export.');
  const next=await pdf.save();window.KAGZIPdfEditorApi.setBytes?window.KAGZIPdfEditorApi.setBytes(next):null;
  // The main editor owns its working bytes; update through the public state setter.
  await window.KAGZIPdfEditorApi.replaceBytes(next);
  clearSelection();await renderTextLayer();
 }catch(error){hint('Could not replace this text: '+(error.message||'unsupported font or document'));apply.disabled=false;}
}
function bind(){
 const toggle=byId('editExistingText'),layer=byId('pdfTextLayer');
 if(!toggle||!layer)return;
 toggle.addEventListener('click',()=>{enabled=!enabled;toggle.classList.toggle('active',enabled);toggle.textContent=enabled?'✓ Text selection ON':'✎ Edit PDF text';layer.style.pointerEvents=enabled?'auto':'none';renderTextLayer();});
 byId('applyNativeTextEdit')?.addEventListener('click',applyReplacement);
 window.addEventListener('kagzi:pdf-rendered',event=>{window.__kagziEditorZoom=event.detail?.viewport?.scale||1;if(toggle)toggle.disabled=false;renderTextLayer();});
 document.addEventListener('kagzi:pdf-opened',()=>{if(toggle)toggle.disabled=false;});
}
document.addEventListener('DOMContentLoaded',bind);
})();