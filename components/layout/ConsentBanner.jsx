import React from 'react';
import { Link } from 'react-router-dom';
import { setConsent, useBannerOpen } from '@/lib/consent';

export default function ConsentBanner() {
  const open = useBannerOpen();
  if (!open) return null;
  return (
    <div role="dialog" aria-label="Services extérieurs" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5">
      <div className="max-w-3xl mx-auto bg-white border border-border rounded-xl shadow-xl p-5 sm:p-6">
        <p className="font-serif font-semibold text-primary mb-2">Services extérieurs</p>
        <p className="text-sm text-foreground/75 leading-relaxed mb-5">
          Ce site fait appel à des services extérieurs : la carte Google Maps, le formulaire de contact Tally et la détection précise
          de votre pays pour vous proposer le bon mode de livraison. Ils peuvent recevoir votre adresse IP et déposer des cookies.
          Aucun cookie publicitaire n'est utilisé.{' '}
          <Link to="/confidentialite" className="underline underline-offset-2 hover:text-primary">En savoir plus</Link>
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => setConsent(false)}
            className="rounded-full border border-primary text-primary text-sm font-semibold px-6 py-2.5 hover:bg-primary/5 transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => setConsent(true)}
            className="rounded-full bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 hover:bg-primary/90 transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
