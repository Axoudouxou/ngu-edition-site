import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

const API_BASE = 'https://payment.nguedition.com';

/** Returns a map { key: value } of all editable site texts. */
export function useSiteContent() {
  const { data = {} } = useQuery({
    queryKey: ['site-content'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/site-content`);
        if (!res.ok) throw new Error('failed');
        return await res.json();
      } catch (_) {
        return {};
      }
    },
    staleTime: 1000 * 60,
  });
  return useMemo(() => data || {}, [data]);
}
