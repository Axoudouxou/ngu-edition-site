import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOfferings } from '@/lib/bookOfferings';
import { isNguBook, publisherLabel } from '@/lib/publisher';

export default function BookCard({ book, delay = 0 }) {
  const { hasEbook, hasPhysical, ebookPrice, physicalPrice } = getOfferings(book);
  const prices = [ebookPrice, physicalPrice].filter((p) => p > 0);
  const priceLabel = prices.length
    ? `À partir de ${Math.min(...prices).toLocaleString('fr-FR')} FCFA`
    : '';
  const availability = hasEbook && hasPhysical
    ? 'Disponible en e-book et format papier'
    : hasPhysical
      ? 'Disponible en format papier'
      : 'Disponible en e-book';

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      <Link to={`/livre/${book.id}`} className="group block">
        {/* Cover */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-5 shadow-md group-hover:shadow-xl transition-shadow duration-400">
          <img
            src={book.coverSrc}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Info */}
        <div className="space-y-2 px-1">
          <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isNguBook(book) ? 'text-[#8A6A2A]' : 'text-muted-foreground'}`}>{publisherLabel(book)}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{book.author}</p>
          <h3 className="font-serif text-xl font-semibold text-primary leading-snug group-hover:text-accent transition-colors duration-200">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground">{availability}</p>
          <p className="text-lg font-bold text-primary">{priceLabel}</p>
        </div>

        {/* CTA */}
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:gap-3 transition-all duration-200">
          Voir le livre <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    </motion.div>
  );
}
