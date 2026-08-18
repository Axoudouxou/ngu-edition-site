import React from 'react';
import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';

export default function InstagramSection() {
  const content = useSiteContent();
  const instagramUrl = content.instagram_url || 'https://www.instagram.com/nevergiveupedt';
  const instagramHandle = content.instagram_handle || '@nevergiveupedt';

  return (
    <section className="py-24 bg-background border-t border-border/40">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Instagram className="w-10 h-10 text-accent mx-auto mb-5" />
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-4">
            Rejoignez la communauté
          </h2>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">
            Suivez nos actualités, découvrez les coulisses et rejoignez une communauté de lecteurs inspirés.
          </p>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-base px-9 py-4 rounded-full hover:bg-accent/90 transition-colors duration-200"
          >
            <Instagram className="w-5 h-5" />
            {instagramHandle}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
