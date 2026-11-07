(function(root){
'use strict';
const DISABLED_REASON='Native PDF text editing is disabled: PDFcanvas Form XObject replacement has not passed the complete save/reopen regression gate.';
const api=Object.freeze({
  status(){return Object.freeze({available:false,enabled:false,engine:'PDFcanvas/PDFium',reason:DISABLED_REASON});},
  async replaceText(){
    const error=new Error(DISABLED_REASON);
    error.code='KAGZI_NATIVE_TEXT_EDIT_DISABLED';
    throw error;
  }
});
if(root)root.KAGZIPdfNativeText=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
