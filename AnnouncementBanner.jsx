import React from 'react';
import { Link } from 'react-router-dom';
import T from '@/components/editable/T';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useEditMode } from '@/lib/editMode';

const TEXT = 'Livraison mondiale · Ebook téléchargement immédiat · Paiement sécurisé · ';

export default function AnnouncementBanner() {
  const content = useSiteContent();
  const { editing } = useEditMode();
  const text = content.banner_text || TEXT;
  // Repeat text enough times to fill wide screens seamlessly
  const repeated = Array(6).fill(text.endsWith(' ') ? text : `${text} · `).join('');

  // En mode édition : une seule ligne fixe, modifiable
  if (editing) {
    return (
      <div className="block overflow-hidden" style={{ backgroundColor: 'hsl(36, 40%, 90%)' }}>
        <p className="text-xs font-medium py-2 px-4 text-primary/80 tracking-wide text-center">
          <T k="banner_text" fallback={TEXT.trim()} />
        </p>
      </div>
    );
  }

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
