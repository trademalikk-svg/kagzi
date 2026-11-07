(function(){
'use strict';
const COMPLEX_SCRIPT=/[\u0900-\u097F\u0600-\u06FF]/;
async function draw(pdf,page,text,options){
 const value=String(text||'');
 if(!COMPLEX_SCRIPT.test(value))return false;
 if(!pdf||!page||typeof pdf.embedPng!=='function'||typeof page.drawImage!=='function'||!document.createElement)throw new Error('Unicode text rendering is unavailable in this browser.');
 const opts=options||{},width=Math.max(24,Number(opts.width)||240),height=Math.max(18,Number(opts.height)||Math.max(30,(Number(opts.fontSize)||14)*1.8)),fontSize=Math.max(6,Math.min(160,Number(opts.fontSize)||14)),scale=2;
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas text rendering is unavailable.');
 if(document.fonts&&document.fonts.ready)await document.fonts.ready;
 ctx.scale(scale,scale);ctx.clearRect(0,0,width,height);ctx.fillStyle=opts.color||'#17233c';ctx.globalAlpha=Math.max(0,Math.min(1,Number(opts.opacity??100)/100));
 ctx.font=(opts.italic?'italic ':'')+(opts.bold?'700 ':'400 ')+fontSize+'px sans-serif';ctx.textBaseline='top';
 const rtl=/[\u0600-\u06FF]/.test(value);ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=opts.align==='center'?'center':opts.align==='right'?'end':rtl?'right':'left';
 const inset=4,available=Math.max(8,width-inset*2),lineHeight=Math.max(fontSize*1.25,8),lines=[];
 for(const paragraph of value.replace(/\r/g,'').split('\n')){
  const words=paragraph.split(/\s+/).filter(Boolean);if(!words.length){lines.push('');continue;}
  let line='';
  for(const word of words){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>available){lines.push(line);line=word;}else line=candidate;}
  if(line)lines.push(line);
 }
 let y= Math.max(0,(height-lines.length*lineHeight)/2);
 for(const line of lines){const x=opts.align==='center'?width/2:rtl?width-inset:inset;ctx.fillText(line,x,y,available);y+=lineHeight;}
 const blob=await new Promise((resolve,reject)=>{if(typeof canvas.toBlob!=='function'){reject(new Error('PNG export is unavailable.'));return;}canvas.toBlob(result=>result?resolve(result):reject(new Error('Could not encode Unicode text.')),'image/png');});
 const bytes=new Uint8Array(await blob.arrayBuffer()),image=await pdf.embedPng(bytes);
 page.drawImage(image,{x:Number(opts.x)||0,y:Number(opts.y)||0,width,height,opacity:Math.max(0,Math.min(1,Number(opts.opacity??100)/100))});
 return true;
}
window.KAGZIPdfUnicodeText={draw};
})();