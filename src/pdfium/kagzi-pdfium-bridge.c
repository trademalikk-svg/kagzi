#include <limits.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "public/fpdf_edit.h"
#include "public/fpdf_save.h"
#include "public/fpdf_text.h"
#include "public/fpdfview.h"

#define KAGZI_MAX_FORM_DEPTH 64

typedef struct {
  FPDF_FILEWRITE base;
  unsigned char* data;
  size_t size;
  size_t capacity;
  int failed;
} KagziSaveBuffer;

static int kagzi_save_block(FPDF_FILEWRITE* writer,const void* data,unsigned long size) {
  KagziSaveBuffer* buffer=(KagziSaveBuffer*)writer;
  if(buffer->failed||size>SIZE_MAX-buffer->size){buffer->failed=1;return 0;}
  size_t needed=buffer->size+(size_t)size;
  if(needed>buffer->capacity){
    size_t capacity=buffer->capacity?buffer->capacity:4096;
    while(capacity<needed){if(capacity>SIZE_MAX/2){capacity=needed;break;}capacity*=2;}
    unsigned char* grown=(unsigned char*)realloc(buffer->data,capacity);
    if(!grown){buffer->failed=1;return 0;}
    buffer->data=grown;buffer->capacity=capacity;
  }
  memcpy(buffer->data+buffer->size,data,(size_t)size);buffer->size=needed;return 1;
}

static int kagzi_matches_at(FPDF_TEXTPAGE page,int start,const uint32_t* target,uint32_t length,FPDF_PAGEOBJECT* matched){
  FPDF_PAGEOBJECT object=FPDFText_GetTextObject(page,start);
  if(!object||FPDFPageObj_GetType(object)!=FPDF_PAGEOBJ_TEXT)return 0;
  for(uint32_t i=0;i<length;i++){
    if(FPDFText_GetUnicode(page,start+(int)i)!=target[i]||FPDFText_GetTextObject(page,start+(int)i)!=object)return 0;
  }
  const int count=FPDFText_CountChars(page);
  for(int i=0;i<count;i++){
    if(FPDFText_GetTextObject(page,i)==object&&(i<start||i>=start+(int)length))return 0;
  }
  *matched=object;return 1;
}

static int kagzi_find_in_form(FPDF_PAGEOBJECT form,FPDF_PAGEOBJECT target,FPDF_PAGEOBJECT* parents,int depth,int* found_depth){
  if(depth>KAGZI_MAX_FORM_DEPTH)return 0;
  const int count=FPDFFormObj_CountObjects(form);
  if(count<0)return 0;
  for(int i=0;i<count;i++){
    FPDF_PAGEOBJECT child=FPDFFormObj_GetObject(form,(unsigned long)i);
    if(!child)return 0;
    if(child==target){*found_depth=depth;return 1;}
    if(FPDFPageObj_GetType(child)==FPDF_PAGEOBJ_FORM){
      parents[depth]=child;
      if(kagzi_find_in_form(child,target,parents,depth+1,found_depth))return 1;
    }
  }
  return 0;
}

static int kagzi_find_owner_path(FPDF_PAGE page,FPDF_PAGEOBJECT target,FPDF_PAGEOBJECT* parents,int* found_depth){
  const int count=FPDFPage_CountObjects(page);
  for(int i=0;i<count;i++){
    FPDF_PAGEOBJECT object=FPDFPage_GetObject(page,i);
    if(!object)return 0;
    if(object==target){*found_depth=0;return 1;}
    if(FPDFPageObj_GetType(object)==FPDF_PAGEOBJ_FORM){
      parents[0]=object;
      if(kagzi_find_in_form(object,target,parents,1,found_depth))return 1;
    }
  }
  return 0;
}

static int kagzi_utf32_to_utf16(const uint32_t* input,uint32_t length,unsigned short** output){
  if(!input||!length||!output||(size_t)length>SIZE_MAX/(2*sizeof(unsigned short))-1)return 0;
  unsigned short* converted=(unsigned short*)malloc(((size_t)length*2+1)*sizeof(unsigned short));
  if(!converted)return 0;
  size_t used=0;
  for(uint32_t i=0;i<length;i++){
    uint32_t cp=input[i];
    if(cp>0x10FFFF||(cp>=0xD800&&cp<=0xDFFF)){free(converted);return 0;}
    if(cp<=0xFFFF)converted[used++]=(unsigned short)cp;
    else{cp-=0x10000;converted[used++]=(unsigned short)(0xD800+(cp>>10));converted[used++]=(unsigned short)(0xDC00+(cp&0x3FF));}
  }
  converted[used]=0;*output=converted;return 1;
}

#ifdef __cplusplus
extern "C" {
#endif

int kagzi_pdf_replace_text(const unsigned char* pdf_bytes,uint32_t pdf_size,int page_index,const uint32_t* target,uint32_t target_length,const uint32_t* replacement,uint32_t replacement_length,unsigned char** output_bytes,uint32_t* output_size){
  if(!pdf_bytes||!pdf_size||page_index<0||!target||!target_length||target_length>INT_MAX||!replacement||!replacement_length||replacement_length>INT_MAX||!output_bytes||!output_size)return -1;
  *output_bytes=NULL;*output_size=0;
  for(uint32_t i=0;i<target_length;i++)if(target[i]>0x10FFFF||(target[i]>=0xD800&&target[i]<=0xDFFF))return -1;
  unsigned short* utf16=NULL;
  if(!kagzi_utf32_to_utf16(replacement,replacement_length,&utf16))return -1;
  FPDF_InitLibrary();
  FPDF_DOCUMENT document=FPDF_LoadMemDocument64(pdf_bytes,(unsigned long long)pdf_size,NULL);
  if(!document){free(utf16);FPDF_DestroyLibrary();return -2;}
  if(page_index>=FPDF_GetPageCount(document)){FPDF_CloseDocument(document);free(utf16);FPDF_DestroyLibrary();return -3;}
  FPDF_PAGE page=FPDF_LoadPage(document,page_index);
  if(!page){FPDF_CloseDocument(document);free(utf16);FPDF_DestroyLibrary();return -3;}
  FPDF_TEXTPAGE text_page=FPDFText_LoadPage(page);
  if(!text_page){FPDF_ClosePage(page);FPDF_CloseDocument(document);free(utf16);FPDF_DestroyLibrary();return -4;}
  FPDF_PAGEOBJECT target_object=NULL;int matches=0;const int chars=FPDFText_CountChars(text_page);
  for(int i=0;i+(int)target_length<=chars;i++){FPDF_PAGEOBJECT candidate=NULL;if(kagzi_matches_at(text_page,i,target,target_length,&candidate)){target_object=candidate;matches++;}}
  FPDFText_ClosePage(text_page);
  if(matches!=1||!target_object){FPDF_ClosePage(page);FPDF_CloseDocument(document);free(utf16);FPDF_DestroyLibrary();return matches>1?-5:-4;}
  FPDF_PAGEOBJECT parents[KAGZI_MAX_FORM_DEPTH+1]={0};int depth=0;
  if(!kagzi_find_owner_path(page,target_object,parents,&depth)){FPDF_ClosePage(page);FPDF_CloseDocument(document);free(utf16);FPDF_DestroyLibrary();return -6;}
  if(!FPDFText_SetText(target_object,utf16)){FPDF_ClosePage(page);FPDF_CloseDocument(document);free(utf16);FPDF_DestroyLibrary();return -7;}
  free(utf16);
  for(int i=depth-1;i>=0;i--){
    FPDF_PAGEOBJECT child=(i==depth-1)?target_object:parents[i+1];
    if(!FPDFFormObj_MarkObjectDirty(parents[i],child)){FPDF_ClosePage(page);FPDF_CloseDocument(document);FPDF_DestroyLibrary();return -8;}
  }
  if(!FPDFPage_GenerateContent(page)){FPDF_ClosePage(page);FPDF_CloseDocument(document);FPDF_DestroyLibrary();return -9;}
  KagziSaveBuffer save={0};save.base.version=1;save.base.WriteBlock=kagzi_save_block;
  FPDF_BOOL saved=FPDF_SaveAsCopy(document,&save.base,FPDF_NO_INCREMENTAL);
  FPDF_ClosePage(page);FPDF_CloseDocument(document);FPDF_DestroyLibrary();
  if(!saved||save.failed||!save.data||!save.size||save.size>UINT32_MAX){free(save.data);return -10;}
  *output_bytes=save.data;*output_size=(uint32_t)save.size;return 0;
}

void kagzi_pdf_free(unsigned char* bytes){free(bytes);}
#ifdef __cplusplus
}
#endif
