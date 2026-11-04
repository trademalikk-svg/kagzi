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
  {
    id: 'ncert-hi',
    title: 'NCERT Official Textbook Catalogue',
    author: 'NCERT',
    language: 'hi',
    languageLabel: 'हिंदी',
    category: 'knowledge',
    subject: 'स्कूली पाठ्यपुस्तकें · सभी विषय',
    description: 'कक्षा 1–12 की आधिकारिक हिंदी पाठ्यपुस्तकें। किताबें NCERT की अपनी वेबसाइट पर ही खोलें।',
    sourceName: 'NCERT',
    contentPath: null,
    rightsStatus: 'link-only',
    rightsNote: 'NCERT prohibits third-party hosting or redistribution; this is an official-source link only.'
  },
  {
    id: 'ncert-en',
    title: 'NCERT Official Textbook Catalogue',
    author: 'NCERT',
    language: 'en',
    languageLabel: 'English',
    category: 'knowledge',
    subject: 'School textbooks · All subjects',
    description: 'Official NCERT textbooks for classes 1–12 in English. Open books on the NCERT website.',
    sourceName: 'NCERT',
    contentPath: null,
    rightsStatus: 'link-only',
    rightsNote: 'NCERT prohibits third-party hosting or redistribution; this is an official-source link only.'
  },
  {
    id: 'ncert-ur',
    title: 'NCERT Official Textbook Catalogue',
    author: 'NCERT',
    language: 'ur',
    languageLabel: 'اردو',
    category: 'knowledge',
    subject: 'درسی کتابیں · تمام مضامین',
    description: 'NCERT کی سرکاری اردو نصابی کتابیں۔ کتابیں صرف NCERT کی ویب سائٹ پر کھولیں۔',
    sourceName: 'NCERT',
    contentPath: null,
    rightsStatus: 'link-only',
    rightsNote: 'NCERT prohibits third-party hosting or redistribution; this is an official-source link only.'
  }
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
