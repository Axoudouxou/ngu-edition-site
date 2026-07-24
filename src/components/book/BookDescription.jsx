import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Sparkles, Wrench, Heart } from 'lucide-react';

const COVER_1 = 'https://media.base44.com/images/public/69e157c4e5760ca5035c57bd/09a57da28_image.png';

const points = [
  { icon: Sparkles, label: 'Des histoires vraies et inspirantes' },
  { icon: Wrench,   label: 'Des outils concrets pour surmonter les obstacles' },
  { icon: Heart,    label: 'Un message universel qui touche chaque lecteur' },
];

export default function BookDescription() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Book image */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex justify-center"
          >
            <div className="relative" style={{ perspective: 800 }}>
              <motion.img
                src={COVER_1}
                alt="Si j'avais su à 16 ans"
                whileHover={{ rotateY: 12, rotateX: -4, scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="w-64 md:w-72 rounded-lg shadow-2xl object-cover"
                style={{ transformStyle: 'preserve-3d' }}
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/15 blur-xl rounded-full" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div>
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">À propos du livre</p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary leading-tight">
                Bien plus qu'un livre
              </h2>
            </div>

            <p className="text-foreground/70 leading-relaxed text-base md:text-lg">
              Never Give Up est bien plus qu'un livre — c'est un compagnon de route pour tous ceux qui traversent des épreuves. À travers des récits authentiques et des leçons de vie puissantes, ce livre vous guide vers la version la plus forte de vous-même. Chaque chapitre est une invitation à ne jamais abandonner, même quand tout semble perdu.
            </p>

            <div className="space-y-4">
              {points.map(({ icon: Icon, label }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground/80 font-medium">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
