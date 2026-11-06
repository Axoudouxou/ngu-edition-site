import React, { useState } from 'react';
import { reopenConsent, useConsent } from '@/lib/consent';

/** N'affiche un contenu extérieur (carte, formulaire…) qu'avec l'accord du visiteur, ou sur sa demande. */
export default function ExternalGate({ service, action, height = 300, children }) {
  const consent = useConsent();
  const [shown, setShown] = useState(false);
  if (consent === true || shown) return children;
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 rounded-2xl border border-border/60 bg-muted/40 px-6" style={{ minHeight: height }}>
      <p className="text-sm text-foreground/75 leading-relaxed max-w-sm">
        Ce contenu est fourni par {service}. Son affichage envoie votre adresse IP à ce service et peut déposer des cookies.
      </p>
      <button type="button" onClick={() => setShown(true)} className="rounded-full bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 hover:bg-primary/90 transition-colors">
        {action}
      </button>
      <button type="button" onClick={reopenConsent} className="text-xs text-foreground/70 underline underline-offset-2 hover:text-primary">
        Gérer mes choix
      </button>
    </div>
  );
}
