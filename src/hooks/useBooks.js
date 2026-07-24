import { useQuery } from '@tanstack/react-query';
import { books as staticBooks } from '@/lib/books';

const API_BASE = 'https://payment.nguedition.com';

/**
 * Returns the list of books. Source of truth = our backend; falls back to the
 * static books.js while loading or if the backend returns nothing.
 */
export function useBooks() {
  const { data } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/books`);
        if (!res.ok) throw new Error('failed');
        const list = await res.json();
        return (list && list.length > 0) ? list : staticBooks;
      } catch (_) {
        return staticBooks;
      }
    },
    staleTime: 1000 * 60,
  });
  return { books: data || staticBooks, loading: !data };
}
