import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '@/hooks/useSiteContent';

const DEFAULT_TEXT =
  'Never Give Up Édition est une maison d’édition engagée, née avec l’ambition de donner une voix aux histoires qui transforment, inspirent et encouragent. Nous publions des ouvrages qui parlent de résilience, de foi, d’identité et de dépassement de soi, et nous accueillons dans notre librairie les livres d’autres maisons d’édition et d’auteurs.';

const DEFAULT_QUOTE = {
  text: 'Votre livre est devenu un refuge. Un espace où je me retrouve et où je parviens à me libérer.',
  author: 'Khady Yasmine B.',
};

function firstQuote(value) {
  try {
    const list = JSON.parse(value);
    if (Array.isArray(list) && list[0] && list[0].text) return list[0];
  } catch (_) { /* ignore */ }
  return DEFAULT_QUOTE;
}

export default function MaisonSection() {
  const content = useSiteContent();
  const quote = firstQuote(content.home_testimonials);

  return (
    <section className="px-6 py-20 md:py-28 border-t border-border/50">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[1fr_2.2fr] md:gap-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A6A2A] md:pt-3">La maison</p>
        <div>
          <p className="font-editorial text-[1.7rem] md:text-4xl leading-snug text-primary">
            {content.home_maison_text || DEFAULT_TEXT}
          </p>
          <Link to="/notre-histoire" className="inline-block mt-8 text-sm font-medium text-primary border-b border-primary pb-0.5 hover:text-primary/70">
            Lire notre histoire
          </Link>

          <figure className="mt-16 pt-10 border-t border-border/60 max-w-xl">
            <blockquote className="font-editorial italic text-2xl leading-snug text-foreground/80">
              « {quote.text} »
            </blockquote>
            {quote.author && (
              <figcaption className="mt-4 text-sm text-muted-foreground">{quote.author}</figcaption>
            )}
          </figure>
        </div>
      </div>
    </section>
  );
}
