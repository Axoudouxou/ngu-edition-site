import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Librairie from '@/components/librairie/Librairie';
import { useBooks } from '@/hooks/useBooks';
import BookCard from '@/components/products/BookCard';
import { motion } from 'framer-motion';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { isNguBook } from '@/lib/publisher';

const TABS = [{ id: 'ngu', label: 'NGU Store' }, { id: 'librairie', label: 'Librairie' }];

function TabSwitch({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Boutique" className="relative inline-flex rounded-full bg-[#D8D0C0] p-1">
      <span aria-hidden="true" className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary transition-transform duration-300 ${value === 'librairie' ? 'translate-x-full' : ''}`} />
      {TABS.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`relative z-10 min-w-[120px] sm:min-w-[140px] px-6 py-2.5 rounded-full font-serif font-semibold text-[15px] transition-colors duration-300 ${value === t.id ? 'text-primary-foreground' : 'text-primary/80'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function Boutique() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') === 'librairie' ? 'librairie' : 'ngu';
  const changeTab = (id) => setParams(id === 'librairie' ? { onglet: 'librairie' } : {}, { replace: true });
  const { region, loading, setManualOverride } = useGeoRegion();
  const { books } = useBooks();

  const isAfrica = region === 'africa';
  const ngu = books.filter(isNguBook);
  const partners = books.filter((b) => !isNguBook(b));

  const grid = (list) => (
    <div className="grid grid-cols-2 gap-8 md:gap-14 max-w-2xl mx-auto">
      {list.map((book, i) => (
        <BookCard key={book.id} book={book} delay={i * 0.12} />
      ))}
    </div>
  );

  return (
    <div>
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
      <h1 className="sr-only">Boutique</h1>
      <div className="flex justify-center mb-12"><TabSwitch value={tab} onChange={changeTab} /></div>

      {tab === 'librairie' ? <Librairie /> : (<>
      {/* Books grid */}
      {partners.length === 0 ? (
        grid(books)
      ) : (
        <div className="space-y-20">
          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary text-center mb-10">Publications NGU</h2>
            {grid(ngu)}
          </section>
          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary text-center mb-10">Maisons partenaires</h2>
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
      </>)}
    </div>
    </div>
  );
}
