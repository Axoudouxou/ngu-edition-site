import React from 'react';
import { motion } from 'framer-motion';
import { useBooks } from '@/hooks/useBooks';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { isNguBook } from '@/lib/publisher';
import BookTile from '@/components/products/BookTile';

export default function Boutique() {
  const { region, loading, setManualOverride } = useGeoRegion();
  const { books } = useBooks();
  const content = useSiteContent();

  const isAfrica = region === 'africa';
  const ngu = books.filter(isNguBook);
  const partners = books.filter((b) => !isNguBook(b));

  const grid = (list) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-14">
      {list.map((book, i) => <BookTile key={book.id} book={book} delay={(i % 3) * 0.08} />)}
    </div>
  );

  const sectionTitle = 'font-editorial font-medium text-3xl md:text-4xl text-primary mb-10';

  return (
    <div className="px-6">
      <div className="max-w-6xl mx-auto py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-16 md:mb-20"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A6A2A] mb-5">
            {content.boutique_eyebrow || 'Tous les livres'}
          </p>
          <h1 className="font-editorial font-medium text-5xl md:text-7xl leading-[1.02] tracking-tight text-primary">
            {content.boutique_title || 'La librairie NGU'}
          </h1>
        </motion.div>

        {partners.length === 0 ? (
          grid(books)
        ) : (
          <div className="space-y-24">
            <section>
              <h2 className={sectionTitle}>Publications NGU</h2>
              {grid(ngu)}
            </section>
            <section className="border-t border-border/60 pt-16">
              <h2 className={sectionTitle}>Maisons partenaires</h2>
              {grid(partners)}
            </section>
          </div>
        )}

        {/* Manual override */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-20"
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
