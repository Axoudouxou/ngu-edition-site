import React from 'react';
import { useBooks } from '@/hooks/useBooks';
import BookCard from '@/components/products/BookCard';
import { motion } from 'framer-motion';
import { useGeoRegion } from '@/hooks/useGeoRegion';



const PRICES = {
  africa: { ebook: '5 000 FCFA', physique: '7 000 FCFA' },
  world:  { ebook: '5 000 FCFA', physique: '7 000 FCFA' },
};

export default function Boutique() {
  const { region, loading, setManualOverride } = useGeoRegion();
  const { books } = useBooks();

  const isAfrica = region === 'africa';

  return (
    <div>
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Tous nos titres</p>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-primary">La bibliothèque NGU</h1>
      </motion.div>

      {/* Books grid */}
      <div className="grid grid-cols-2 gap-8 md:gap-14 max-w-2xl mx-auto">
        {books.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            delay={i * 0.12}
            region={region}
            prices={PRICES}
            amazonUrl={book.amazonUrl}
          />
        ))}
      </div>

      {/* Manual override */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-14"
        >
          {isAfrica ? (
            <button
              onClick={() => setManualOverride('world')}
              className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
            >
              Vous êtes en Europe ou en Amérique ? Cliquez ici
            </button>
          ) : (
            <button
              onClick={() => setManualOverride('africa')}
              className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
            >
              Vous êtes en Afrique ? Cliquez ici
            </button>
          )}
        </motion.div>
      )}
    </div>
    </div>
  );
}
