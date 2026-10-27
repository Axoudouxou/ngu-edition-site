import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooks } from '@/hooks/useBooks';
import { useSiteContent } from '@/hooks/useSiteContent';
import { isNguBook } from '@/lib/publisher';

const SIGNATURE = 'Les histoires méritent leur place.';
const SUBTITLE = 'Une maison pour les voix d’aujourd’hui et les idées qui traversent le temps.';

// Position des couvertures dans le panneau (en % du cadre)
const LAYOUTS = {
  1: [{ left: '21%', top: '10%', width: '58%' }],
  2: [
    { left: '6%', top: '6%', width: '50%' },
    { left: '44%', top: '30%', width: '50%' },
  ],
};

export default function HeroSection() {
  const content = useSiteContent();
  const { books } = useBooks();

  const featured = [...books.filter(isNguBook), ...books.filter((b) => !isNguBook(b))]
    .filter((b) => b.coverSrc)
    .slice(0, 2);
  const layout = LAYOUTS[featured.length];

  return (
    <section className={`grid ${layout ? 'md:grid-cols-[1.05fr_1fr]' : ''} md:min-h-[calc(100svh-4rem)]`}>
      <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-16 md:py-24">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A6A2A] mb-7"
        >
          Never Give Up Édition
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
          className="font-editorial font-medium text-[2.9rem] sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-primary mb-7 max-w-xl"
        >
          {content.home_signature || SIGNATURE}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-base text-foreground/70 leading-relaxed max-w-sm mb-10"
        >
          {content.home_signature_subtitle || SUBTITLE}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
          className="flex flex-wrap items-center gap-x-8 gap-y-4"
        >
          <Link
            to="/boutique"
            className="inline-block bg-primary text-primary-foreground text-sm font-medium px-7 py-3.5 rounded-sm hover:bg-primary/90 transition-colors"
          >
            Explorer les livres
          </Link>
          <Link
            to="/publier"
            className="text-sm font-medium text-primary border-b border-primary pb-1 hover:text-primary/70 hover:border-primary/70 transition-colors"
          >
            Publier avec NGU
          </Link>
        </motion.div>
      </div>

      {layout && (
        <div className="bg-primary flex items-center justify-center p-8 md:p-12">
          <div className="relative w-full max-w-[520px] aspect-[5/6]">
            {featured.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.35 + i * 0.2, ease: 'easeOut' }}
                className="absolute"
                style={{ ...layout[i], zIndex: i + 1 }}
              >
                <Link to={`/livre/${book.id}`} aria-label={book.title}>
                  <img
                    src={book.coverSrc}
                    alt={`Couverture de ${book.title}`}
                    className="w-full aspect-[2/3] object-cover rounded-[2px] shadow-[0_20px_40px_-14px_rgba(0,0,0,0.55)]"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
