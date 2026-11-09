import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('article admin page is registered and protected by shared auth guard',()=>{
 const manifest=JSON.parse(read('.github/kagzi-html-pages.json'));
 assert.ok(manifest.includes('articles-admin.html'));
 const html=read('articles-admin.html');
 assert.match(html,/<body[^>]*data-kagzi-protected="true"/);
 assert.ok(html.includes('/auth-guard.js'));
 assert.ok(html.includes('/config.js'));
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
});

test('article dashboard checks the existing library-admin allowlist before enabling workspace',()=>{
 const js=read('articles-admin.js');
 assert.ok(js.includes("from('kagzi_library_admins')"));
 assert.ok(js.includes("from('kagzi_articles')"));
 assert.ok(js.includes("if(!admin) throw new Error"));
 assert.ok(js.includes("status==='pending_review'"));
 assert.ok(js.includes("setArticleStatus('approved')"));
 assert.ok(js.includes("setArticleStatus('published')"));
});

test('article workflow supports bilingual India and worldwide drafts and source attribution',()=>{
 const html=read('articles-admin.html');
 for(const value of ['value="hi"','value="en"','value="india"','value="worldwide"']) assert.ok(html.includes(value));
 const js=read('articles-admin.js');
 for(const value of ['source_urls','trend_query','trend_source','seo_title','meta_description']) assert.ok(js.includes(value));
 assert.ok(js.includes("payload.created_by=currentUser.id"));
});

test('publishing is approval-gated and does not expose unapproved articles',()=>{
 const js=read('articles-admin.js');
 assert.ok(js.includes("$('publishArticle').disabled=a.status!=='approved'"));
 assert.ok(js.includes("if(!confirm('Publish this approved article record?'))return"));
 assert.ok(js.includes("if(status==='approved')"));
});
