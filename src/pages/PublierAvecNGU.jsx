import React from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Vous nous présentez votre livre',
    text: 'Écrivez-nous avec le titre, un court résumé et votre fichier. Nous revenons vers vous pour en discuter.',
  },
  {
    title: 'Nous le mettons en vente',
    text: 'Votre livre rejoint la librairie en ligne NGU, en ebook et, selon l’accord passé avec nous, en version papier. Pour le papier, vous déposez vos exemplaires chez NGU, qui gère la logistique. La livraison est à la charge du lecteur.',
  },
  {
    title: 'Vous suivez vos ventes',
    text: 'Vous disposez d’un espace auteur : exemplaires vendus, gains et versements. Les versements ont lieu une fois par mois.',
  },
];

export default function PublierAvecNGU() {
  return (
    <div className="px-6">
      <div className="max-w-3xl mx-auto py-20 md:py-28">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A6A2A] mb-6">Auteurs et maisons d’édition</p>
        <h1 className="font-editorial font-medium text-5xl md:text-7xl leading-[1.02] tracking-tight text-primary mb-8">
          Publier avec NGU
        </h1>
        <p className="font-editorial text-2xl md:text-3xl leading-snug text-foreground/80 max-w-2xl">
          La librairie NGU accueille les livres de NGU Édition, ceux d’autres maisons d’édition et ceux d’auteurs qui veulent être lus.
        </p>

        <ol className="mt-20 space-y-12 border-t border-border/60 pt-12">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-6">
              <span className="font-editorial text-4xl text-[#8A6A2A] leading-none">{i + 1}</span>
              <div>
                <h2 className="font-editorial text-2xl md:text-3xl text-primary mb-3">{s.title}</h2>
                <p className="text-foreground/70 leading-relaxed max-w-xl">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-16 pt-10 border-t border-border/60 text-foreground/70 max-w-xl leading-relaxed">
          Les conditions financières sont précisées dans le contrat que nous signons ensemble.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            to="/contact"
            className="inline-block bg-primary text-primary-foreground text-sm font-medium px-7 py-3.5 rounded-sm hover:bg-primary/90 transition-colors"
          >
            Nous écrire
          </Link>
          <Link
            to="/auteur"
            className="text-sm font-medium text-primary border-b border-primary pb-1 hover:text-primary/70 hover:border-primary/70 transition-colors"
          >
            Déjà publié chez nous ? Mon espace auteur
          </Link>
        </div>
      </div>
    </div>
  );
}
