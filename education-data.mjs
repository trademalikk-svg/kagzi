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
    ['public-domain', 'licensed', 'permission-granted'].includes(book.rightsStatus) &&
    ((book.accessTier || 'free') === 'free' ? Number(book.priceInr || 0) === 0 :
      book.accessTier === 'paid' && Number.isInteger(book.priceInr) && book.priceInr > 0)
  );
}

export function filterBooks(items, { query = '', language = 'all', category = 'all', accessTier = 'all' } = {}) {
  const q = String(query).trim().toLocaleLowerCase();
  return items.filter(book => {
    if (!isPublishable(book)) return false;
    const languageMatch = language === 'all' || book.language === language;
    const categoryMatch = category === 'all' || book.category === category;
    const tier = book.accessTier || 'free';
    const accessMatch = accessTier === 'all' || tier === accessTier;
    const haystack = [book.title, book.author, book.subject, book.description].join(' ').toLocaleLowerCase();
    return languageMatch && categoryMatch && accessMatch && (!q || haystack.includes(q));
  });
}
