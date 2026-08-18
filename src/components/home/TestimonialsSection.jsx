import React from 'react';
import { motion } from 'framer-motion';
import { useSiteContent } from '@/hooks/useSiteContent';

const DEFAULT_TESTIMONIALS = [
  {
    text: "Votre livre est devenu un refuge. Un espace où je me retrouve et où je parviens à me libérer.",
    author: 'Khady Yasmine B.',
  },
  {
    text: "Je me suis surprise plusieurs fois à prier, pleurer, rire, sourire en lisant. Rare sont les ouvrages qui font cet effet.",
    author: 'Yasmina S.',
  },
  {
    text: "Le plus marquant, c'est la place que Jésus a eue dans ce livre et surtout dans ton histoire.",
    author: 'Astrid E.',
  },
];

function parseList(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

export default function TestimonialsSection() {
  const content = useSiteContent();
  const testimonials = parseList(content.home_testimonials, DEFAULT_TESTIMONIALS);

  return (
    <section className="py-24 bg-background border-t border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Lecteurs</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">Ce qu'ils disent</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              className="relative bg-white border border-border/50 rounded-2xl px-8 py-10 shadow-sm flex flex-col"
            >
              <span className="font-serif text-7xl leading-none text-secondary/40 absolute -top-2 left-6 select-none">"</span>
              <p className="font-serif text-lg italic text-foreground/75 leading-relaxed mt-6 flex-1">
                {t.text}
              </p>
              <p className="mt-6 text-sm font-semibold text-accent tracking-wide">— {t.author}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
