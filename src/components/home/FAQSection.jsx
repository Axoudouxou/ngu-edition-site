import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useSiteContent } from '@/hooks/useSiteContent';

const DEFAULT_FAQS = [
  {
    question: 'Vous livrez où ?',
    answer: 'Nous livrons dans le monde entier. Nos livres sont aussi disponibles en librairie à la FNAC Cap Sud et FNAC Cap Nord à Abidjan.',
  },
  {
    question: 'Quel est le délai de livraison ?',
    answer: 'Entre 7 et 15 jours ouvrés selon votre pays.',
  },
  {
    question: 'Comment je reçois mon ebook ?',
    answer: 'Immédiatement après le paiement, par email.',
  },
  {
    question: 'Comment nous contacter ?',
    answer: 'Par email à edition@nguedition.com ou WhatsApp au +225 07 03 82 92 89.',
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

export default function FAQSection() {
  const content = useSiteContent();
  const faqs = parseList(content.home_faq, DEFAULT_FAQS);

  return (
    <section className="bg-muted/40 border-t border-border/40 py-20">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary text-center mb-12">
          Questions fréquentes
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-background rounded-lg border border-border/50 px-6"
            >
              <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/70 leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
