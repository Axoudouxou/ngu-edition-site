import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Badge, Empty, ErrorNote, Page, Panel, Spinner, Table, btn, inputCls, useLoad } from './ui';
import { api } from './api';

function physicalFormats(book) {
  const formats = (book.formats || []).filter((f) => f.category === 'physique');
  if (formats.length) return formats.map((f) => ({ id: f.id, label: f.label || 'Livre papier' }));
  return Number(book.physiquePriceFCFA) > 0 ? [{ id: `${book.id}-physique`, label: 'Livre papier' }] : [];
}

function Row({ book, format, entry, sold, defaultThreshold, onSaved }) {
  const known = !!entry;
  const left = known ? Number(entry.quantity) - sold : null;
  const [qty, setQty] = useState(known ? String(Math.max(left, 0)) : '');
  const [threshold, setThreshold] = useState(String(known ? entry.low_stock_threshold : defaultThreshold));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api('/api/admin/stock', {
        method: 'POST',
        body: {
          book_id: book.id, format_id: format.id, book_title: book.title, format_label: format.label,
          quantity: Number(qty) || 0, low_stock_threshold: Number(threshold) || 0,
        },
      });
      await api('/api/admin/v2/stock-baseline', { method: 'POST', body: { format_id: format.id } });
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  let badge = <Badge tone="grey">À renseigner</Badge>;
  if (known) {
    badge = left <= 0 ? <Badge tone="red">Épuisé</Badge>
      : left <= Number(entry.low_stock_threshold) ? <Badge tone="ochre">Stock bas</Badge>
        : <Badge tone="green">En stock</Badge>;
  }

  return (
    <tr>
      <td className="px-4 py-3"><p className="font-medium">{book.title}</p><p className="text-xs text-[#7B8478]">{format.label}</p></td>
      <td className="px-4 py-3 text-right"><span className="font-editorial text-2xl text-[#20392D]">{known ? Math.max(left, 0) : '—'}</span></td>
      <td className="px-4 py-3">{badge}</td>
      <td className="px-4 py-3 w-32"><input type="number" min="0" aria-label="Quantité en stock" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" /></td>
      <td className="px-4 py-3 w-28"><input type="number" min="0" aria-label="Seuil d'alerte" className={inputCls} value={threshold} onChange={(e) => setThreshold(e.target.value)} /></td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button className={btn.ghost} onClick={save} disabled={saving || qty === ''}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle className="w-4 h-4" /> : null}
          {done ? 'Enregistré' : 'Enregistrer'}
        </button>
        {error && <p className="text-xs text-[#A33B2F] mt-1">{error}</p>}
      </td>
    </tr>
  );
}

export default function Stock() {
  const state = useLoad(async () => {
    const [books, rows, sold, settings] = await Promise.all([
      api('/api/admin/books'), api('/api/admin/stock'), api('/api/admin/v2/stock-sold'), api('/api/admin/v2/settings'),
    ]);
    return { books, stock: Object.fromEntries(rows.map((r) => [r.format_id, r])), sold, threshold: settings.default_low_stock };
  });

  const d = state.data;
  const rows = d ? d.books.flatMap((b) => physicalFormats(b).map((f) => ({ book: b, format: f }))) : [];

  return (
    <Page title="Stock" subtitle="Compte les exemplaires papier déposés chez NGU. Chaque vente payée fait baisser le stock toute seule ; un remboursement le fait remonter.">
      <ErrorNote>{state.error}</ErrorNote>
      {state.loading ? <Spinner /> : rows.length === 0 ? (
        <Panel><Empty>Aucun livre n'a de version papier.</Empty></Panel>
      ) : (
        <Table head={['Livre', { label: 'Il en reste', right: true }, 'État', 'Quantité en stock', "Alerte à", '']}>
          {rows.map(({ book, format }) => (
            <Row
              key={`${format.id}-${d.stock[format.id]?.quantity}-${d.sold[format.id]?.sold || 0}`}
              book={book} format={format} entry={d.stock[format.id]} sold={d.sold[format.id]?.sold || 0}
              defaultThreshold={d.threshold} onSaved={state.reload}
            />
          ))}
        </Table>
      )}
      <p className="text-xs text-[#7B8478] mt-4">Pour corriger le stock après un nouveau comptage, change la quantité puis enregistre : le décompte repart de ce chiffre.</p>
    </Page>
  );
}
