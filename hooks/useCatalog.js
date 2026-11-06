import { useEffect, useState } from 'react';

const API_BASE = 'https://payment.nguedition.com';
let cache = null; // la liste est chargée une seule fois par visite

export function useCatalog() {
  const [state, setState] = useState({ items: cache || [], loading: !cache, error: false });
  useEffect(() => {
    if (cache) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/api/catalog`)
      .then((r) => { if (!r.ok) throw new Error('catalogue indisponible'); return r.json(); })
      .then((data) => { cache = data.items || []; if (!cancelled) setState({ items: cache, loading: false, error: false }); })
      .catch(() => { if (!cancelled) setState({ items: [], loading: false, error: true }); });
    return () => { cancelled = true; };
  }, []);
  return state;
}
