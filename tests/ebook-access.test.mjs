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
