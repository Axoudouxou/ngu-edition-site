import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSiteContent } from '@/hooks/useSiteContent';

const DEFAULT_TITLE = 'La librairie NGU accueille de nouveaux auteurs.';
const DEFAULT_TEXT =
  'Vous avez déjà publié un livre, y compris dans une autre maison d’édition ? Proposez-le dans la librairie NGU, en ebook ou en version papier, et suivez vos ventes depuis votre espace auteur.';

export default function NouveauteSection() {
  const content = useSiteContent();
  const title = content.home_annonce_title === undefined ? DEFAULT_TITLE : content.home_annonce_title;
  const text = content.home_annonce_text === undefined ? DEFAULT_TEXT : content.home_annonce_text;

  // Titre vidé dans l'admin : l'annonce n'apparaît plus
  if (!title || !title.trim()) return null;

  return (
    <section className="bg-primary text-primary-foreground py-16 md:py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center"
      >
        <p className="text-secondary text-xs font-semibold tracking-widest uppercase mb-4">Nouveauté</p>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold leading-tight mb-5">{title}</h2>
        {text && (
          <p className="text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto mb-8">{text}</p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-4">
          <Link
            to="/publier"
            className="inline-flex items-center bg-primary-foreground text-primary font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-primary-foreground/90 transition-colors"
          >
            Publier avec NGU
          </Link>
          <Link
            to="/auteur"
            className="text-sm font-medium text-primary-foreground border-b border-primary-foreground/50 pb-0.5 hover:border-primary-foreground transition-colors"
          >
            Déjà auteur chez nous ? Mon espace auteur
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
