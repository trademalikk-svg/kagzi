import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('current affairs are separated into four physical folder entry pages', () => {
  for (const path of [
    'current-affairs/index.html',
    'current-affairs/day/index.html',
    'current-affairs/weekly/index.html',
    'current-affairs/monthly/index.html',
    'current-affairs/yearly/index.html'
  ]) assert.ok(existsSync(new URL(path, root)), path + ' exists');
  const home = read('current-affairs/index.html');
  for (const folder of ['day/','weekly/','monthly/','yearly/']) assert.ok(home.includes('href="'+folder+'"'));
});

test('folder pages open the correct daily, weekly, monthly and yearly archive views', () => {
  assert.ok(read('current-affairs/day/index.html').includes('../archive.html?view=daily'));
  assert.ok(read('current-affairs/weekly/index.html').includes('../archive.html?view=weekly'));
  assert.ok(read('current-affairs/monthly/index.html').includes('../archive.html?view=monthly'));
  assert.ok(read('current-affairs/yearly/index.html').includes('Paid Only'));
});

test('Learning Hub and legacy route point to the folder library', () => {
  const education = read('education.html');
  assert.ok(education.includes('href="current-affairs/"'));
  const legacy = read('current-affairs.html');
  assert.ok(legacy.includes("location.replace('current-affairs/')"));
});


test('archive navigation is clearly labeled as online reading, not a PDF download', () => {
  for (const [path, label] of [
    ['current-affairs/weekly/index.html', 'ऑनलाइन संग्रह देखें'],
    ['current-affairs/monthly/index.html', 'ऑनलाइन संग्रह देखें'],
    ['current-affairs/yearly/index.html', 'ऑनलाइन संग्रह देखें']
  ]) if (path.includes('yearly')) assert.ok(read(path).includes('Paid Only')); else assert.ok(read(path).includes(label), path + ' labels archive as online');
});

test('yearly PDF is paid-only with no free sample and no fake purchase link', () => {
  const yearly = read('current-affairs/yearly/index.html');
  assert.ok(yearly.includes('Paid Only'));
  assert.ok(yearly.includes('कोई Free PDF, Free Sample'));
  assert.ok(yearly.includes('अभी भुगतान स्वीकार नहीं किया जा रहा है'));
  assert.ok(!yearly.includes('href="payment'));
});


test('legacy Current Affairs book page is now a folder landing page, not the full long book', () => {
  const legacy = read('current-affairs-book.html');
  assert.ok(legacy.includes('location.replace(\'current-affairs/\')'));
  assert.ok(legacy.includes('http-equiv=\"refresh\"'));
  assert.ok(read('current-affairs-book-source.html').includes('UPSC सिविल सेवा मुख्य परीक्षा 2026 का लिखित परिणाम'));
});

test('PDF generator and workflow publish files only into Daily, Weekly and Monthly folders', () => {
  const generator = read('scripts/build_current_affairs_pdfs.py');
  const workflow = read('.github/workflows/current-affairs-pdfs.yml');
  for (const folder of ['current-affairs/day/', 'current-affairs/weekly/', 'current-affairs/monthly/']) assert.ok(generator.includes(folder));
  assert.ok(workflow.includes('Build Current Affairs PDFs'));
  assert.ok(!generator.includes('current-affairs/yearly/'));
  assert.ok(read('current-affairs/archive.html').includes('Paid Only'));
});
