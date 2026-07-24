import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const librairies = [
  { name: 'Librairie Mont Carmel', address: 'Abidjan' },
  { name: 'FNAC Cap Nord', address: 'Cap Nord Mall, Abidjan' },
  { name: 'FNAC Cap Sud', address: 'Cap Sud Mall, Abidjan' },
];

// Embed centré sur Abidjan avec les 3 points
const MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d63526.31!2d-4.0305!3d5.3599!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sFNAC%20Cap%20Nord%20Abidjan%7CFNAC%20Cap%20Sud%20Abidjan%7CLibrairie%20Mont%20Carmel%20Abidjan!5e0!3m2!1sfr!2sci!4v1680000000000!5m2!1sfr!2sci';

export default function LibrairiesSection() {
  return (
    <section className="bg-muted/40 py-20 md:py-28 border-t border-border/40">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">En librairie</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-3">
            Retrouvez nos livres à Abidjan
          </h2>
          <p className="font-serif text-lg italic text-muted-foreground">Disponibles dans ces librairies</p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {librairies.map((lib, i) => (
            <motion.div
              key={lib.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-background border border-border/60 rounded-2xl px-6 py-7 flex items-start gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-serif font-semibold text-primary text-base leading-snug">{lib.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{lib.address}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-2xl overflow-hidden border border-border/60 shadow-sm"
        >
          <iframe
            title="Librairies Abidjan"
            src={MAP_EMBED}
            width="100%"
            height="380"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>

      </div>
    </section>
  );
}
