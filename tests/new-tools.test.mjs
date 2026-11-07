import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const pages=[
 ['resume-cv-maker.html','Resume & CV Maker',['cvPreview','printCv']],
 ['hindi-english-typing-tools.html','Hindi & English Typing Tools',['editor','toHindi']],
 ['online-calculators.html','Online Calculators',['ageBtn','emiBtn']]
];
test('new tools have SEO metadata and public routes',()=>{
 for(const [path,title,ids] of pages){
  const html=read(path);
  assert.ok(html.includes('<title>'+title),path+' title');
  assert.ok(html.includes('name="description"'),path+' description');
  assert.ok(html.includes('name="robots" content="index,follow'),path+' indexing');
  assert.ok(html.includes('rel="canonical"'),path+' canonical');
  assert.ok(!html.includes('data-kagzi-protected="true"'),path+' stays public');
  for(const id of ids)assert.ok(html.includes('id="'+id+'"'),path+' missing '+id);
 }
});
test('inline JavaScript in the new tools parses',()=>{
 for(const [path] of pages){
  const html=read(path);
  const chunks=html.split('<script>');
  for(let i=1;i<chunks.length;i++){
   const source=chunks[i].split('</script>')[0];
   if(source.trim())new vm.Script(source,{filename:path+' inline script '+i});
  }
 }
});
test('catalogue activates resume and lists typing and calculator tools',()=>{
 const modules=read('modules.js');
 for(const name of ['Resume & CV Maker','Hindi & English Typing Tools','Online Calculators'])assert.ok(modules.includes(name));
 assert.ok(modules.includes("36:'resume-cv-maker.html'"));
 assert.ok(modules.includes("66:'hindi-english-typing-tools.html'"));
 assert.ok(modules.includes("67:'online-calculators.html'"));
 assert.ok(modules.includes("shown.length+' / 67'"));
});
test('homepage and sitemap link all three tools',()=>{
 const home=read('index.html'),sitemap=read('sitemap.xml');
 for(const slug of ['resume-cv-maker','hindi-english-typing-tools','online-calculators']){
  assert.ok(home.includes(slug+'.html'),'homepage '+slug);
  assert.ok(sitemap.includes('https://kagzi-8cy.pages.dev/'+slug),'sitemap '+slug);
 }
});
