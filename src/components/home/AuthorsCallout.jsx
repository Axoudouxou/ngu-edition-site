import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthorsCallout() {
  return (
    <section className="bg-primary text-primary-foreground px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2 md:gap-16 items-end">
        <h2 className="font-editorial font-medium text-4xl md:text-6xl leading-[1.05]">
          Votre livre mérite d’être découvert.
        </h2>
        <div>
          <p className="text-base leading-relaxed text-primary-foreground/80 max-w-md mb-8">
            Auteurs et maisons d’édition : proposez vos ebooks et vos livres papier dans la librairie NGU,
            et suivez vos ventes depuis votre espace.
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              to="/publier"
              className="inline-block bg-primary-foreground text-primary text-sm font-medium px-7 py-3.5 rounded-sm hover:bg-primary-foreground/90 transition-colors"
            >
              Publier avec NGU
            </Link>
            <Link
              to="/auteur"
              className="text-sm font-medium text-primary-foreground border-b border-primary-foreground/60 pb-1 hover:border-primary-foreground transition-colors"
            >
              Déjà publié chez nous ? Mon espace auteur
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
