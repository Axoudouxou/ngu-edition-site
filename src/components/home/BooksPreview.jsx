import React from 'react';
import { useBooks } from '@/hooks/useBooks';
import BookCard from '@/components/products/BookCard';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BooksPreview() {
  const { books } = useBooks();
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14">
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">La bibliothèque NGU</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">Nos livres</h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-8 md:gap-14 max-w-2xl mx-auto">
          {books.map((book, i) =>
          <BookCard key={book.id} book={book} delay={i * 0.12} />
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12">
          <Link
            to="/boutique"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b border-border/50 pb-0.5 hover:border-primary">
            Voir toute la boutique →
          </Link>
        </motion.div>
      </div>
    </section>);

}
