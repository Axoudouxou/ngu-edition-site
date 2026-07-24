import { useState, useEffect } from 'react';

const AFRICAN_COUNTRIES = new Set([
  'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG',
  'GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR',
  'MU','MA','MZ','NA','NE','NG','RW','ST','SN','SL','SO','ZA','SS','SD','SZ','TZ',
  'TG','TN','UG','ZM','ZW',
]);

export function useGeoRegion() {
  // 'africa' | 'world' | null (loading)
  const [region, setRegion] = useState(null);
  const [manualOverride, setManualOverride] = useState(null); // 'africa' | 'world'

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const isAfrica = AFRICAN_COUNTRIES.has(data.country_code);
        setRegion(isAfrica ? 'africa' : 'world');
      })
      .catch(() => setRegion('world'));
  }, []);

  const effectiveRegion = manualOverride ?? region;

  return { region: effectiveRegion, loading: region === null, setManualOverride };
}
