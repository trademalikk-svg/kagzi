import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('Resume & CV Maker is public, linked from Office Work, and listed in sitemap', () => {
  const page = read('resume-cv-maker.html');
  const office = read('office.html');
  const sitemap = read('sitemap.xml');
  assert.match(page, /<title>Free Resume & CV Maker Online/);
  assert.match(page, /name="description"/);
  assert.match(page, /rel="canonical"/);
  assert.doesNotMatch(page, /data-kagzi-protected=["']true["']/);
  for (const id of ['fullName','email','education','experience','skills','cvPreview','printCv']) assert.ok(page.includes('id="' + id + '"'), 'missing ' + id);
  assert.ok(office.includes('href="resume-cv-maker.html"'));
  assert.ok(sitemap.includes('https://kagzi-8cy.pages.dev/resume-cv-maker'));
});
test('Resume Maker inline JavaScript parses', () => {
  const page = read('resume-cv-maker.html');
  for (const part of page.split('<script>').slice(1)) {
    const source = part.split('</script>')[0];
    if (source.trim()) new Function(source);
  }
});
