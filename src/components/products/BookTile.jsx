import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOfferings } from '@/lib/bookOfferings';
import { isNguBook, publisherLabel } from '@/lib/publisher';

const fcfa = (n) => `${Number(n).toLocaleString('fr-FR')} FCFA`;

export default function BookTile({ book, delay = 0 }) {
  const { ebookPrice, physicalPrice } = getOfferings(book);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Link to={`/livre/${book.id}`} className="group block">
        <img
          src={book.coverSrc}
          alt={`Couverture de ${book.title}`}
          loading="lazy"
          className="w-full aspect-[2/3] object-cover rounded-[2px] bg-muted transition-opacity duration-300 group-hover:opacity-90"
        />
        <p className={`mt-5 text-[11px] font-medium uppercase tracking-[0.16em] ${isNguBook(book) ? 'text-[#8A6A2A]' : 'text-muted-foreground'}`}>
          {publisherLabel(book)}
        </p>
        <h3 className="font-editorial text-2xl leading-tight text-primary mt-2 group-hover:underline underline-offset-4 decoration-1">
          {book.title}
        </h3>
        <p className="text-sm text-foreground/70 mt-1.5">{book.author}</p>
        <p className="text-xs text-foreground/60 mt-3 leading-relaxed">
          {ebookPrice > 0 && <>Ebook · {fcfa(ebookPrice)}<br /></>}
          {physicalPrice > 0 && <>Papier · {fcfa(physicalPrice)}</>}
        </p>
      </Link>
    </motion.div>
  );
}
