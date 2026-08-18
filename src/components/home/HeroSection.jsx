import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import HeroDoorsIntro from './HeroDoorsIntro';

const COVER_1 = 'https://media.base44.com/images/public/69e157c4e5760ca5035c57bd/09a57da28_image.png';
const COVER_2 = 'https://media.base44.com/images/public/69e157c4e5760ca5035c57bd/f65254426_image.png';

export default function HeroSection() {
  const content = useSiteContent();
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background pt-24 pb-16 px-6">

      <HeroDoorsIntro coverSrc1={COVER_1} coverSrc2={COVER_2} />

      {/* ── Top text block ── */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xs font-medium tracking-widest uppercase text-primary/50"
        >
          {content.home_hero_eyebrow || 'Never Give Up Édition'}
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-primary leading-[1.1] tracking-tight"
        >
          {content.home_hero_title || 'Découvrez nos ouvrages.'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="text-base sm:text-lg text-foreground/60 leading-relaxed max-w-xl"
        >
          {content.home_hero_subtitle || 'Des livres pour inspirer, motiver et accompagner votre croissance personnelle. Écrits avec cœur, pensés pour vous.'}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link to="/boutique">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-8 py-3.5 rounded-full"
            >
              Commander nos livres
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>

          <Link to="/notre-histoire">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 border border-primary text-primary font-semibold text-sm px-8 py-3.5 rounded-full bg-transparent hover:bg-primary/5 transition-colors"
            >
              Notre histoire
            </motion.button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="text-xs text-foreground/35 tracking-wide"
        >
          Livraison mondiale · Paiement sécurisé
        </motion.p>
      </div>

      {/* ── Book covers below ── */}
      <div className="flex items-end justify-center gap-6 sm:gap-10 mt-16 flex-shrink-0">
        {[
          { src: COVER_1, to: '/livre/si-javais-su-a-16-ans', delay: 0.9, offset: 0 },
          { src: COVER_2, to: '/livre/dieu-connait-ton-nom',  delay: 1.1, offset: -24 },
        ].map((book, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: book.offset }}
            transition={{ duration: 0.9, delay: book.delay, ease: 'easeOut' }}
            whileHover={{ y: book.offset - 8, transition: { duration: 0.3 } }}
            style={{ zIndex: i === 1 ? 2 : 1 }}
          >
            <Link to={book.to}>
              <div
                className="rounded-xl overflow-hidden cursor-pointer shadow-lg"
                style={{ width: 'clamp(130px, 28vw, 240px)', aspectRatio: '2/3' }}
              >
                <img src={book.src} alt="couverture" className="w-full h-full object-cover" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
