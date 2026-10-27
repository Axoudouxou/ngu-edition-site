// Un livre sans maison d'édition renseignée est un livre NGU.
function norm(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function isNguBook(book) {
  const p = norm(book.publisher);
  return !p || p.startsWith('ngu') || p.startsWith('never give up');
}

export function publisherLabel(book) {
  return isNguBook(book) ? 'Édition NGU' : book.publisher;
}
