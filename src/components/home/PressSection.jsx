import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Quote } from 'lucide-react';

const pressLinks = [
  { name: 'Fratmat.info', url: 'https://www.fratmat.info/article/2633756' },
  { name: "L'Infodrome", url: 'https://www.linfodrome.com/societe/109046-litterature-sohan-adou-devoile-son-parcours-dans-si-j-avais-su-a-16-ans' },
];

export default function PressSection() {
  return (
    <section className="py-24 bg-muted/30 border-y border-border/40">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Médias</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">Ils parlent de nous</h2>
        </motion.div>

        {/* Logos presse */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-6 mb-14"
        >
          {pressLinks.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-border/60 rounded-full px-7 py-3.5 text-sm font-semibold text-primary hover:border-primary hover:shadow-md transition-all duration-200"
            >
              {item.name}
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>
          ))}
        </motion.div>

        {/* Citation encadrée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-2xl mx-auto bg-white border border-border/60 rounded-2xl px-10 py-9 shadow-sm text-center"
        >
          <Quote className="w-8 h-8 text-secondary/60 mx-auto mb-4" />
          <p className="font-serif text-xl italic text-foreground/75 leading-relaxed">
            "En lisant le livre d'un confrère ivoirien nommé Sohan Adou, une inspiration m'est venue à l'esprit."
          </p>
          <p className="mt-5 text-sm font-semibold text-accent">— @collinetbrz, créateur de contenu</p>
        </motion.div>
      </div>
    </section>
  );
}
