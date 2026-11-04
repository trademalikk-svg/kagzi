export const books = [];

export function isPublishable(book) {
  return Boolean(
    book && typeof book.title === 'string' && book.title.trim() &&
    typeof book.author === 'string' && book.author.trim() &&
    ['hi', 'en', 'ur'].includes(book.language) &&
    typeof book.subject === 'string' && book.subject.trim() &&
    typeof book.description === 'string' &&
    typeof book.sourceName === 'string' && book.sourceName.trim() &&
    typeof book.contentPath === 'string' && /^books\/[a-z0-9-]+\.pdf$/i.test(book.contentPath) &&
    ['public-domain', 'licensed', 'permission-granted'].includes(book.rightsStatus)
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
