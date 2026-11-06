(function(){
'use strict';
const DB='kagzi-document-session',STORE='documents',KEY='active';
function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Could not open local document session.'));});}
async function run(mode,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode==='get'?'readonly':'readwrite'),store=tx.objectStore(STORE);let request;if(mode==='put')request=store.put(value,KEY);else if(mode==='get')request=store.get(KEY);else request=store.delete(KEY);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Local document session failed.'));tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error||new Error('Local document session failed.'));};});}
window.KAGZIPdfSession={
 save:async function(bytes,name){const copy=bytes instanceof Uint8Array?bytes.slice():new Uint8Array(bytes);await run('put',{bytes:copy.buffer.slice(copy.byteOffset,copy.byteOffset+copy.byteLength),name:String(name||'document.pdf'),savedAt:Date.now(),type:'application/pdf'});return{size:copy.byteLength};},
 load:async function(){const item=await run('get');if(!item||!item.bytes)return null;return{file:new File([item.bytes],item.name||'shared-document.pdf',{type:'application/pdf'}),savedAt:item.savedAt||0};},
 clear:async function(){await run('delete');}
};
})();