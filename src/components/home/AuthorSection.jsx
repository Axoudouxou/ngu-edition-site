import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Quote } from 'lucide-react';

const LOGO_URL = '/logo.jpg';

export default function AuthorSection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Qui est-il ?</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">L'auteur</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex justify-center"
          >
            <motion.div
              whileHover={{ rotate: 3, scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              className="relative"
            >
              <div className="w-52 h-52 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-secondary/50 shadow-2xl bg-muted flex items-center justify-center">
                <img src={LOGO_URL} alt="Sohan Adou" className="w-4/5 object-contain" />
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-3 rounded-full border-2 border-dashed border-secondary/30 animate-spin" style={{ animationDuration: '18s' }} />
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-7"
          >
            <div>
              <h3 className="font-serif text-2xl font-semibold text-primary mb-1">Sohan Adou</h3>
              <p className="text-accent text-sm font-medium tracking-wide">Auteur & fondateur de NGU Édition</p>
            </div>

            <p className="text-foreground/70 leading-relaxed">
              Passionné par le développement personnel et la résilience humaine, Sohan Adou a écrit ses livres après avoir surmonté ses propres défis. Son objectif : offrir aux lecteurs les outils et l'inspiration nécessaires pour se relever, avancer et ne jamais abandonner leurs rêves.
            </p>

            {/* Quote */}
            <div className="relative bg-white border-l-4 border-accent rounded-r-xl px-6 py-5 shadow-sm">
              <Quote className="absolute -top-3 -left-3 w-6 h-6 text-accent fill-accent" />
              <p className="font-serif text-lg italic text-primary/80 leading-relaxed">
                "Ce livre, je l'ai écrit pour celui que j'étais avant — et pour toi, qui en as besoin aujourd'hui."
              </p>
              <p className="mt-3 text-sm font-medium text-muted-foreground">— Sohan Adou</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
