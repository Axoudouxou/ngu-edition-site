import React from 'react';
import { Link } from 'react-router-dom';
import { useBooks } from '@/hooks/useBooks';
import { getOfferings } from '@/lib/bookOfferings';
import { isNguBook, publisherLabel } from '@/lib/publisher';

const fcfa = (n) => `${Number(n).toLocaleString('fr-FR')} FCFA`;

function Entry({ book, partner }) {
  const { ebookPrice, physicalPrice } = getOfferings(book);
  return (
    <div className="flex gap-5 items-start">
      <Link to={`/livre/${book.id}`} className="shrink-0 w-24 sm:w-28">
        <img
          src={book.coverSrc}
          alt={`Couverture de ${book.title}`}
          loading="lazy"
          className="w-full aspect-[2/3] object-cover rounded-[2px] bg-muted"
        />
      </Link>
      <div className="pt-1">
        <p className={`text-[11px] font-medium uppercase tracking-[0.16em] mb-2 ${partner ? 'text-muted-foreground' : 'text-[#8A6A2A]'}`}>
          {publisherLabel(book)}
        </p>
        <Link to={`/livre/${book.id}`} className="font-editorial text-2xl leading-tight text-primary hover:underline underline-offset-4 decoration-1">
          {book.title}
        </Link>
        <p className="text-sm text-foreground/70 mt-1.5">{book.author}</p>
        <p className="text-xs text-foreground/60 mt-3 leading-relaxed">
          {ebookPrice > 0 && <>Ebook · {fcfa(ebookPrice)}<br /></>}
          {physicalPrice > 0 && <>Papier · {fcfa(physicalPrice)}</>}
        </p>
      </div>
    </div>
  );
}

export default function CatalogueSection() {
  const { books } = useBooks();
  const ngu = books.filter(isNguBook);
  const partners = books.filter((b) => !isNguBook(b));
  const cols = (n) => (n > 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2');

  return (
    <>
      {ngu.length > 0 && (
        <section className="px-6 py-20 md:py-28">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline justify-between gap-6 mb-12">
              <h2 className="font-editorial font-medium text-4xl md:text-5xl text-primary">Publications NGU</h2>
              <Link to="/boutique" className="text-sm font-medium text-primary border-b border-primary pb-0.5 shrink-0 hover:text-primary/70">
                Tout le catalogue
              </Link>
            </div>
            <div className={`grid gap-x-14 gap-y-14 ${cols(ngu.length)}`}>
              {ngu.map((b) => <Entry key={b.id} book={b} />)}
            </div>
          </div>
        </section>
      )}

      {partners.length > 0 && (
        <section className="px-6 py-20 md:py-24 bg-muted/60 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-editorial font-medium text-3xl md:text-4xl text-primary mb-12">Maisons partenaires</h2>
            <div className={`grid gap-x-14 gap-y-14 ${cols(partners.length)}`}>
              {partners.map((b) => <Entry key={b.id} book={b} partner />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
