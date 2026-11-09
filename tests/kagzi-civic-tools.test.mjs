import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = {
  legal: await readFile(new URL('../legal-document-generator.html', import.meta.url), 'utf8'),
  complaints: await readFile(new URL('../public-complaints.html', import.meta.url), 'utf8'),
  panchayat: await readFile(new URL('../gram-panchayat.html', import.meta.url), 'utf8'),
};

test('Legal Document Generator provides editable draft preview and print/download path', () => {
  assert.match(pages.legal, /id=["']documentForm["']/);
  assert.match(pages.legal, /id=["']preview["']/);
  assert.match(pages.legal, /window\.print\(\)/);
  assert.match(pages.legal, /कानूनी सलाह का विकल्प नहीं/);
});

test('Public Complaint Guide provides complaint drafting and official grievance destinations', () => {
  assert.match(pages.complaints, /id=["']complaintForm["']/);
  assert.match(pages.complaints, /jansunwai\.up\.nic\.in/);
  assert.match(pages.complaints, /pgportal\.gov\.in/);
  assert.match(pages.complaints, /कॉपी करें/);
});

test('Gram Panchayat Dashboard provides location search and official public-data portals', () => {
  assert.match(pages.panchayat, /id=["']panchayatForm["']/);
  assert.match(pages.panchayat, /egramswaraj\.gov\.in/);
  assert.match(pages.panchayat, /lgdirectory\.gov\.in/);
  assert.match(pages.panchayat, /डेटा सीधे सरकारी पोर्टल से जाँचें/);
});

test('all three civic tools disclose independent status and do not create a family dashboard', () => {
  for (const html of Object.values(pages)) {
    assert.match(html, /KAGZI सरकारी विभाग नहीं है/);
  }
  assert.doesNotMatch(pages.legal + pages.complaints + pages.panchayat, /Family Service Dashboard/i);
});
