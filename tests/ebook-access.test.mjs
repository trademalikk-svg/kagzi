import test from 'node:test';
import assert from 'node:assert/strict';
import { filterBooks, isPublishable } from '../education-data.mjs';

const items = [
  {id:'free-1',title:'Free book',author:'Author',language:'hi',category:'exam',subject:'Math',description:'Basics',sourceName:'KAGZI',contentPath:'books/free-1.pdf',rightsStatus:'licensed',accessTier:'free',priceInr:0},
  {id:'paid-1',title:'Paid book',author:'Author',language:'en',category:'exam',subject:'Science',description:'Advanced',sourceName:'KAGZI',contentPath:'books/paid-1.pdf',rightsStatus:'licensed',accessTier:'paid',priceInr:99}
];

test('catalogue filters free and paid access tiers independently', () => {
  assert.deepEqual(filterBooks(items, { accessTier: 'free' }).map(book => book.id), ['free-1']);
  assert.deepEqual(filterBooks(items, { accessTier: 'paid' }).map(book => book.id), ['paid-1']);
});

test('paid entries require a positive integer INR price and free entries cost zero', () => {
  assert.equal(isPublishable({...items[1], priceInr: 0}), false);
  assert.equal(isPublishable({...items[0], priceInr: 10}), false);
  assert.equal(isPublishable({...items[1], priceInr: 99.5}), false);
});

test('legacy records without access metadata remain free', () => {
  const legacy = {...items[0]};
  delete legacy.accessTier;
  delete legacy.priceInr;
  assert.deepEqual(filterBooks([legacy], { accessTier: 'free' }).map(book => book.id), ['free-1']);
});

import { readFileSync } from 'node:fs';
const education = readFileSync(new URL('../education.html', import.meta.url), 'utf8');
const reader = readFileSync(new URL('../reader.html', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../admin-library.html', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20261106_ebook_access_tiers.sql', import.meta.url), 'utf8');

test('library exposes access filters and displays prices without opening paid PDFs', () => {
  assert.match(education, /data-access="free"/);
  assert.match(education, /data-access="paid"/);
  assert.match(education, /book\.accessTier === 'paid'/);
  assert.match(reader, /if\(book\.access_tier==='paid'\)/);
  assert.match(reader, /payment और account entitlement सुविधा अभी सक्रिय नहीं है/);
});

test('admin records the selected tier and validated INR price', () => {
  assert.match(admin, /access_tier:accessTier,price_inr:priceInr/);
  assert.match(admin, /Number\.isInteger\(priceInr\)/);
});

test('database migration constrains free and paid price combinations', () => {
  assert.match(migration, /access_tier in \('free', 'paid'\)/);
  assert.match(migration, /access_tier = 'paid' and price_inr > 0/);
});
