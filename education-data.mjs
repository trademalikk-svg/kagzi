export const books = [
  {
    id: 'godan-hi',
    title: 'गोदान',
    author: 'मुंशी प्रेमचंद',
    language: 'hi',
    languageLabel: 'हिंदी',
    category: 'literature',
    subject: 'हिंदी साहित्य',
    description: 'प्रेमचंद का प्रसिद्ध हिंदी उपन्यास। विकिस्रोत पर उपलब्ध सार्वजनिक-डोमेन संस्करण।',
    sourceName: 'Wikisource',
    contentPath: null,
    rightsStatus: 'public-domain',
    rightsNote: 'Wikisource file page marks this edition public domain.'
  },
  {
    id: 'pride-prejudice-en',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    language: 'en',
    languageLabel: 'English',
    category: 'literature',
    subject: 'English literature · History of the novel',
    description: 'A classic English novel, available to read online through Project Gutenberg.',
    sourceName: 'Project Gutenberg',
    contentPath: null,
    rightsStatus: 'public-domain',
    rightsNote: 'Project Gutenberg identifies this edition as public domain in the USA; local copyright status can vary.'
  },

];

export function isPublishable(book) {
  return Boolean(
    book && typeof book.title === 'string' && book.title.trim() &&
    typeof book.author === 'string' && book.author.trim() &&
    ['hi', 'en', 'ur'].includes(book.language) &&
    typeof book.subject === 'string' && book.subject.trim() &&
    typeof book.description === 'string' && book.description.trim() &&
    typeof book.sourceName === 'string' && book.sourceName.trim() &&
    (book.contentPath === null || (typeof book.contentPath === 'string' && /^\/library\/books\/[a-z0-9-]+\.pdf$/i.test(book.contentPath))) &&
    ['public-domain', 'licensed'].includes(book.rightsStatus)
  );
}

export function filterBooks(items, { query = '', language = 'all', category = 'all' } = {}) {
  const q = String(query).trim().toLocaleLowerCase();
  return items.filter(book => {
    if (!isPublishable(book)) return false;
    const languageMatch = language === 'all' || book.language === language;
    const categoryMatch = category === 'all' || book.category === category;
    const haystack = [book.title, book.author, book.subject, book.description].join(' ').toLocaleLowerCase();
    return languageMatch && categoryMatch && (!q || haystack.includes(q));
  });
}
