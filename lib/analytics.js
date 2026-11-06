import { useEffect } from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';

/** Charge l'outil de statistiques (Plausible ou Umami, sans cookies) quand son adresse est renseignée dans l'admin. */
export function useAnalytics() {
  const content = useSiteContent();
  const src = (content.analytics_script || '').trim();
  const id = (content.analytics_id || '').trim();
  useEffect(() => {
    if (!src || !id || !/^https:\/\//.test(src)) return;
    if (document.querySelector('script[data-ngu-analytics]')) return;
    const s = document.createElement('script');
    s.defer = true;
    s.src = src;
    s.setAttribute('data-ngu-analytics', '1');
    if (/plausible/i.test(src)) {
      s.setAttribute('data-domain', id);
      s.setAttribute('data-exclude', '/admin/*,/auteur/*,/panier,/paiement-*');
    } else {
      s.setAttribute('data-website-id', id);
    }
    document.head.appendChild(s);
  }, [src, id]);
}
