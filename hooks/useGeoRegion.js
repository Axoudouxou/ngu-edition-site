import { useState, useEffect } from 'react';
import { useConsent } from '@/lib/consent';

const AFRICAN_COUNTRIES = new Set([
  'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG',
  'GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR',
  'MU','MA','MZ','NA','NE','NG','RW','ST','SN','SL','SO','ZA','SS','SD','SZ','TZ',
  'TG','TN','UG','ZM','ZW',
]);

const AFRICAN_ISLANDS = new Set(['Indian/Antananarivo', 'Indian/Comoro', 'Indian/Mauritius', 'Atlantic/Cape_Verde']);

/** Estimation sans requête extérieure : le fuseau horaire de l'appareil. */
function regionFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if ((tz.startsWith('Africa/') && tz !== 'Africa/Ceuta') || AFRICAN_ISLANDS.has(tz)) return 'africa';
  } catch (_) { /* fuseau illisible */ }
  return 'world';
}

export function useGeoRegion() {
  const consent = useConsent();
  // 'africa' | 'world' | null (loading)
  const [region, setRegion] = useState(null);
  const [manualOverride, setManualOverride] = useState(null); // 'africa' | 'world'

  useEffect(() => {
    if (consent !== true) {
      setRegion(regionFromTimezone());
      return undefined;
    }
    // Avec l'accord du visiteur : détection précise par l'adresse IP
    let cancelled = false;
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data && data.country_code) setRegion(AFRICAN_COUNTRIES.has(data.country_code) ? 'africa' : 'world');
        else setRegion(regionFromTimezone());
      })
      .catch(() => { if (!cancelled) setRegion(regionFromTimezone()); });
    return () => { cancelled = true; };
  }, [consent]);

  const effectiveRegion = manualOverride ?? region;

  return { region: effectiveRegion, loading: region === null, setManualOverride };
}
