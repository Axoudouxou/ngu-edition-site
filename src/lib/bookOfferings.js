// Ce qu'on peut acheter pour un livre : ebook, papier, ou les deux.
// Un livre sans version papier a un prix papier à 0 dans l'admin.
export function getOfferings(book) {
  const formats = Array.isArray(book.formats) ? book.formats : [];
  let hasEbook;
  let hasPhysical;
  if (formats.length) {
    hasEbook = formats.some((f) => f.category === 'ebook');
    hasPhysical = formats.some((f) => f.category === 'physique');
  } else {
    hasEbook = book.isEbook !== false;
    hasPhysical = Number(book.physiquePriceFCFA) > 0;
  }
  return {
    hasEbook,
    hasPhysical,
    ebookPrice: hasEbook ? Number(book.ebookPriceFCFA) || 0 : null,
    physicalPrice: hasPhysical ? Number(book.physiquePriceFCFA) || 0 : null,
  };
}
