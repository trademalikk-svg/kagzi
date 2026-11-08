#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "public/fpdf_edit.h"
#include "public/fpdf_save.h"
#include "public/fpdf_text.h"
extern "C" {
int kagzi_pdf_replace_text(const unsigned char*,uint32_t,int,const uint32_t*,uint32_t,const uint32_t*,uint32_t,unsigned char**,uint32_t*);
void kagzi_pdf_free(unsigned char*);
}
#define PDF_CAPACITY 8192
#define OUTPUT_CAPACITY 16384
typedef struct{char bytes[PDF_CAPACITY];size_t size;} PdfBuffer;
typedef struct{FPDF_FILEWRITE base;unsigned char bytes[OUTPUT_CAPACITY];size_t size;} SaveBuffer;
static int appendf(PdfBuffer*b,const char*f,...){va_list a;va_start(a,f);int n=vsnprintf(b->bytes+b->size,sizeof(b->bytes)-b->size,f,a);va_end(a);if(n<0||(size_t)n>=sizeof(b->bytes)-b->size)return 0;b->size+=(size_t)n;return 1;}
static int obj(PdfBuffer*b,size_t o[],int n,const char*body){o[n]=b->size;return appendf(b,"%d 0 obj\n%s\nendobj\n",n,body);}
static int fixture(PdfBuffer*b){
 size_t o[8]={0};const char* page="BT /F1 9 Tf 10 10 Td (PAGECONTROL) Tj ET q /Outer Do Q";const char* outer="q /Inner Do Q";const char* inner="BT /F1 12 Tf 10 100 Td (ORIGINAL) Tj ET";
 if(!appendf(b,"%%PDF-1.7\n")||!obj(b,o,1,"<< /Type /Catalog /Pages 2 0 R >>")||!obj(b,o,2,"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")||!obj(b,o,3,"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 6 0 R >> /XObject << /Outer 4 0 R >> >> /Contents 7 0 R >>"))return 0;
 char s[1024];snprintf(s,sizeof(s),"<< /Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 300 300] /Resources << /XObject << /Inner 5 0 R >> >> /Length %zu >>\nstream\n%s\nendstream",strlen(outer),outer);if(!obj(b,o,4,s))return 0;
 snprintf(s,sizeof(s),"<< /Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 300 300] /Resources << /Font << /F1 6 0 R >> >> /Length %zu >>\nstream\n%s\nendstream",strlen(inner),inner);if(!obj(b,o,5,s))return 0;
 if(!obj(b,o,6,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"))return 0;
 snprintf(s,sizeof(s),"<< /Length %zu >>\nstream\n%s\nendstream",strlen(page),page);if(!obj(b,o,7,s))return 0;
 size_t x=b->size;if(!appendf(b,"xref\n0 8\n0000000000 65535 f \n"))return 0;for(int i=1;i<=7;i++)if(!appendf(b,"%010zu 00000 n \n",o[i]))return 0;return appendf(b,"trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n%zu\n%%%%EOF\n",x);
}
static int saveblock(FPDF_FILEWRITE*w,const void*d,unsigned long n){SaveBuffer*b=(SaveBuffer*)w;if(n>OUTPUT_CAPACITY-b->size)return 0;memcpy(b->bytes+b->size,d,n);b->size+=n;return 1;}
static int has(FPDF_TEXTPAGE p,const char*s){size_t n=strlen(s);int c=FPDFText_CountChars(p);for(int i=0;i+(int)n<=c;i++){size_t k=0;while(k<n&&FPDFText_GetUnicode(p,i+(int)k)==(unsigned char)s[k])k++;if(k==n)return 1;}return 0;}
int main(void){
 PdfBuffer in={{0},0};if(!fixture(&in))return 1;FPDF_InitLibrary();if(FPDFFormObj_MarkObjectDirty(NULL,NULL))return 16;
 FPDF_DOCUMENT doc=FPDF_LoadMemDocument64(in.bytes,(unsigned long long)in.size,NULL);if(!doc)return 2;FPDF_PAGE page=FPDF_LoadPage(doc,0);if(!page){FPDF_CloseDocument(doc);return 3;}
 FPDF_TEXTPAGE before=FPDFText_LoadPage(page);if(!before)return 17;int orig=has(before,"ORIGINAL"),control=has(before,"PAGECONTROL");FPDFText_ClosePage(before);if(!orig||!control)return 18;
 FPDF_PAGEOBJECT outer=NULL;for(int i=0;i<FPDFPage_CountObjects(page);i++){FPDF_PAGEOBJECT x=FPDFPage_GetObject(page,i);if(FPDFPageObj_GetType(x)==FPDF_PAGEOBJ_FORM){outer=x;break;}}if(!outer||FPDFFormObj_CountObjects(outer)!=1)return 4;
 FPDF_PAGEOBJECT inner=FPDFFormObj_GetObject(outer,0);if(!inner||FPDFPageObj_GetType(inner)!=FPDF_PAGEOBJ_FORM||FPDFFormObj_CountObjects(inner)!=1)return 5;
 FPDF_PAGEOBJECT text=FPDFFormObj_GetObject(inner,0);if(!text||FPDFPageObj_GetType(text)!=FPDF_PAGEOBJ_TEXT)return 6;
 if(FPDFFormObj_MarkObjectDirty(outer,text)||FPDFFormObj_MarkObjectDirty(inner,outer))return 25;
 const unsigned short repl[]={'R','E','P','L','A','C','E','D',0};if(!FPDFText_SetText(text,repl))return 7;
 if(!FPDFFormObj_MarkObjectDirty(inner,text)||!FPDFFormObj_MarkObjectDirty(outer,inner)||!FPDFPage_GenerateContent(page))return 8;
 SaveBuffer out={{0},0};out.base.version=1;out.base.WriteBlock=saveblock;if(!FPDF_SaveAsCopy(doc,&out.base,FPDF_NO_INCREMENTAL))return 11;FPDF_ClosePage(page);FPDF_CloseDocument(doc);
 FPDF_DOCUMENT reopened=FPDF_LoadMemDocument64(out.bytes,(unsigned long long)out.size,NULL);if(!reopened)return 12;FPDF_PAGE rp=FPDF_LoadPage(reopened,0);if(!rp){FPDF_CloseDocument(reopened);return 13;}FPDF_TEXTPAGE rt=FPDFText_LoadPage(rp);if(!rt)return 14;
 int found=has(rt,"REPLACED"),old=has(rt,"ORIGINAL"),kept=has(rt,"PAGECONTROL");FPDFText_ClosePage(rt);FPDF_ClosePage(rp);FPDF_CloseDocument(reopened);FPDF_DestroyLibrary();if(!found||old||!kept)return 15;
 const uint32_t t[]={'O','R','I','G','I','N','A','L'},r[]={'B','R','I','D','G','E','O','K'};unsigned char*outbytes=NULL;uint32_t outsize=0;int rc=kagzi_pdf_replace_text((const unsigned char*)in.bytes,(uint32_t)in.size,0,t,8,r,8,&outbytes,&outsize);if(rc||!outbytes||!outsize)return 27;
 FPDF_InitLibrary();FPDF_DOCUMENT bd=FPDF_LoadMemDocument64(outbytes,(unsigned long long)outsize,NULL);if(!bd)return 28;FPDF_PAGE bp=FPDF_LoadPage(bd,0);if(!bp)return 29;FPDF_TEXTPAGE bt=FPDFText_LoadPage(bp);if(!bt)return 30;int br=has(bt,"BRIDGEOK"),bo=!has(bt,"ORIGINAL"),bc=has(bt,"PAGECONTROL");FPDFText_ClosePage(bt);FPDF_ClosePage(bp);FPDF_CloseDocument(bd);FPDF_DestroyLibrary();kagzi_pdf_free(outbytes);if(!br||!bo||!bc)return 31;return 0;
}
