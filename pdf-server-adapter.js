/* Server processing intentionally disabled until a verified private processor and temporary-storage lifecycle are configured. */
(function(){
 'use strict';
 window.KAGZIPdfServer={
  serverProcessingAvailable:function(){return false;},
  requestServerProcessing:async function({file,operation,consent}){
   if(consent!==true)throw new Error('Explicit consent is required before server processing.');
   if(!this.serverProcessingAvailable())throw new Error('Server processing is not configured. Your file has not been uploaded.');
   throw new Error('No server processor is configured.');
  }
 };
})();