import React from 'react';
import { motion } from 'framer-motion';
import { useSiteContent } from '@/hooks/useSiteContent';

function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export default function NotreEngagement() {
  const content = useSiteContent();
  const events = parseList(content.engagement_events);

  return (
    <div className="bg-background">

      {/* Hero */}
      <section className="py-24 md:py-32 text-center border-b border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-5">Never Give Up Édition</p>
            <h1 className="font-serif text-5xl md:text-6xl font-semibold text-primary mb-6">Notre engagement</h1>
            <p className="font-serif text-xl md:text-2xl italic text-muted-foreground">
              Ce qui nous anime, et les moments qui le racontent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Ce qui nous anime</p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">Mission & Vision</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Notre Vision',
                text: content.about_vision_text || "Être un pionnier de l'innovation dans le secteur de la littérature.",
                delay: 0,
              },
              {
                title: 'Notre Mission',
                text: content.about_mission_text || "Être l'anteambulo de chaque créatif qui veut créer, publier et vivre de son art.",
                delay: 0.12,
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: card.delay }}
                className="bg-primary rounded-2xl px-10 py-10 text-primary-foreground"
              >
                <p className="text-secondary text-xs font-semibold tracking-widest uppercase mb-4">{card.title}</p>
                <p className="font-serif text-xl md:text-2xl leading-relaxed">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photos événements */}
      <section className="py-20 md:py-24 bg-muted/30 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">En images</p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">Nos événements</h2>
          </motion.div>

          {events.length === 0 ? (
            <p className="text-center text-muted-foreground italic">Les photos de nos prochains événements arrivent bientôt.</p>
          ) : (
            <div className="relative overflow-hidden -mx-6 px-6" style={{ maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)' }}>
              <div
                className="flex gap-5 w-max ngu-scroll-track"
                style={{ animationDuration: `${Math.max(events.length * 6, 18)}s` }}
              >
                {[...events, ...events].map((ev, i) => (
                  <div
                    key={i}
                    className="w-56 md:w-64 flex-shrink-0 rounded-2xl overflow-hidden bg-white border border-border/50 shadow-sm"
                  >
                    <div className="aspect-square bg-muted">
                      {ev.image_url && (
                        <img src={ev.image_url} alt={ev.caption || 'Événement NGU'} className="w-full h-full object-cover" />
                      )}
                    </div>
                    {ev.caption && (
                      <p className="text-xs text-foreground/70 px-3 py-2.5 text-center">{ev.caption}</p>
                    )}
                  </div>
                ))}
              </div>

              <style>{`
                @keyframes ngu-scroll {
                  from { transform: translateX(0); }
                  to { transform: translateX(-50%); }
                }
                .ngu-scroll-track {
                  animation-name: ngu-scroll;
                  animation-timing-function: linear;
                  animation-iteration-count: infinite;
                }
                .ngu-scroll-track:hover {
                  animation-play-state: paused;
                }
                @media (prefers-reduced-motion: reduce) {
                  .ngu-scroll-track {
                    animation: none;
                    overflow-x: auto;
                  }
                }
              `}</style>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
