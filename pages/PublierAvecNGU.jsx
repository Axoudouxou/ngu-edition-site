import React from 'react';
import { Link } from 'react-router-dom';
import SubmissionForm from '@/components/publish/SubmissionForm';

const steps = [
  {
    title: 'Vous nous envoyez votre livre',
    text: 'Remplissez le formulaire ci-dessus avec vos coordonnées et votre document. Nous revenons vers vous pour en discuter.',
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
        <h1 className="font-serif font-semibold text-4xl md:text-6xl leading-[1.05] tracking-tight text-primary mb-8">
          Publier avec NGU
        </h1>
        <p className="font-serif text-2xl md:text-3xl leading-snug text-foreground/80 max-w-2xl">
          La librairie NGU accueille les livres de NGU Édition, ceux d’autres maisons d’édition et ceux d’auteurs qui veulent être lus.
        </p>

        <section id="proposer" className="mt-14 rounded-2xl border border-border/60 bg-white p-6 md:p-10">
          <h2 className="font-serif text-2xl md:text-3xl text-primary mb-2">Proposer mon livre</h2>
          <p className="text-foreground/70 leading-relaxed mb-8">
            Renseignez vos coordonnées et joignez votre livre ou un extrait au format PDF. Nous vous répondons à l'adresse indiquée.
          </p>
          <SubmissionForm />
        </section>

        <h2 className="font-serif text-2xl md:text-3xl text-primary mt-20 mb-2">Comment ça se passe</h2>
        <ol className="mt-8 space-y-12">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-6">
              <span className="font-serif text-4xl text-[#8A6A2A] leading-none">{i + 1}</span>
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-primary mb-3">{s.title}</h2>
                <p className="text-foreground/70 leading-relaxed max-w-xl">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-16 pt-10 border-t border-border/60 text-foreground/70 max-w-xl leading-relaxed">
          Les conditions financières sont précisées dans le contrat que nous signons ensemble.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
          <Link to="/auteur" className="font-medium text-primary border-b border-primary pb-1 hover:text-primary/70 hover:border-primary/70 transition-colors">
            Déjà publié chez nous ? Mon espace auteur
          </Link>
          <Link to="/contact" className="text-foreground/70 hover:text-primary underline underline-offset-4">Une question ? Écrivez-nous</Link>
        </div>
      </div>
    </div>
  );
}
