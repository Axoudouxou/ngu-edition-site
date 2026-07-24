import React from 'react';
import { motion } from 'framer-motion';
import { useSiteContent } from '@/hooks/useSiteContent';

const SOHAN_PHOTO = 'https://media.base44.com/images/public/69e157c4e5760ca5035c57bd/4dd714482_image.png';

export default function NotreHistoire() {
  const content = useSiteContent();
  return (
    <div className="bg-background">

      {/* ── 1. Hero ── */}
      <section className="py-24 md:py-32 text-center border-b border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}>
            
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-5">Never Give Up Édition</p>
            <h1 className="font-serif text-5xl md:text-6xl font-semibold text-primary mb-6">
              {content.about_title || 'Notre histoire'}
            </h1>
            <p className="font-serif text-xl md:text-2xl italic text-muted-foreground">
              {content.about_tagline || 'Une maison d\'édition. Une mission. Une génération.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Fondateur ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">

            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex justify-center">
              
              <div className="w-72 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-border/40">
                <img
                  src={SOHAN_PHOTO}
                  alt="Sohan Adou"
                  className="w-full h-full object-cover object-top" />
                
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-5">
              
              <div>
                <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Le fondateur</p>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">Sohan Adou</h2>
                <p className="font-serif text-lg italic text-primary/60 mt-1">
                 Auteur ivoirien · Never Give Up Édition
                </p>
              </div>

              <div className="w-10 h-0.5 bg-secondary rounded-full" />

              <p className="text-foreground/70 leading-relaxed text-base">{content.about_founder_bio || `Sohan Adou, de son nom complet Adou Kpangny Sohan-Henri Mian, est un jeune auteur ivoirien et le fondateur de Never Give Up Édition. Né en 2003 et passionné par le développement personnel et la foi chrétienne, il utilise l'écriture comme un moyen de transmettre courage, résilience et espoir aux jeunes. À 21 ans, il publie son premier ouvrage, Si j'avais su à 16 ans, un récit inspiré de son propre parcours marqué par des défis personnels, des choix déterminants et une profonde quête de sens. À travers ses projets et son engagement, Sohan souhaite encourager la jeunesse à croire en son potentiel et à ne jamais abandonner, peu importe les épreuves.`}

              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 3. Mission & Vision ── */}
      <section className="py-20 md:py-24 bg-muted/30 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12">
            
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Ce qui nous anime</p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">Mission & Vision</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
            {
              title: 'Notre Vision',
              text: content.about_vision_text || "Être un pionnier de l'innovation dans le secteur de la littérature.",
              delay: 0
            },
            {
              title: 'Notre Mission',
              text: content.about_mission_text || 'Être l\'anteambulo de chaque créatif qui veut créer, publier et vivre de son art.',
              delay: 0.12
            }].
            map((card) =>
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: card.delay }}
              className="bg-primary rounded-2xl px-10 py-10 text-primary-foreground">
              
                <p className="text-secondary text-xs font-semibold tracking-widest uppercase mb-4">{card.title}</p>
                <p className="font-serif text-xl md:text-2xl leading-relaxed">
                  {card.text}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

    </div>);

}
