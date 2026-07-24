import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LOGO_URL = 'https://media.base44.com/images/public/69e157c4e5760ca5035c57bd/b51e7226e_image.png';

export default function AboutSection() {
  return (
    <section className="bg-muted/40 border-t border-border/40 py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Logo column */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex justify-center"
          >
            <div className="w-56 md:w-72 h-56 md:h-72 rounded-2xl bg-muted flex items-center justify-center border border-border/60 shadow-sm">
              <img src={LOGO_URL} alt="Never Give Up Édition" className="w-4/5 object-contain" />
            </div>
          </motion.div>

          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-5"
          >
            <div>
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">À propos</p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary leading-tight">
                Never Give Up Édition
              </h2>
              <p className="font-serif text-lg italic text-muted-foreground mt-2">
                Une maison d'édition née pour la jeunesse
              </p>
            </div>

            <div className="w-10 h-0.5 bg-secondary rounded-full" />

            <p className="text-foreground/70 leading-relaxed">
              Never Give Up Édition est une maison d'édition engagée, née avec l'ambition de donner une voix aux histoires qui transforment, inspirent et encouragent la jeunesse. Nous publions des ouvrages qui parlent de résilience, de foi, d'identité et de dépassement de soi.
            </p>

            <Link to="/notre-histoire">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-7 py-3 rounded-full"
              >
                Notre histoire
              </motion.button>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
