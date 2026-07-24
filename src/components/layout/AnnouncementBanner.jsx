import React from 'react';
import { Link } from 'react-router-dom';

const TEXT = 'Livraison mondiale · Disponible à la FNAC Abidjan · Ebook téléchargement immédiat · Paiement sécurisé · ';

export default function AnnouncementBanner() {
  // Repeat text enough times to fill wide screens seamlessly
  const repeated = Array(6).fill(TEXT).join('');

  return (
    <Link to="/boutique" className="block overflow-hidden cursor-pointer" style={{ backgroundColor: 'hsl(36, 40%, 90%)' }}>
      <div className="flex whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
        <span className="text-xs font-medium py-2 px-4 text-primary/80 tracking-wide">{repeated}</span>
        <span className="text-xs font-medium py-2 px-4 text-primary/80 tracking-wide" aria-hidden>{repeated}</span>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </Link>
  );
}
