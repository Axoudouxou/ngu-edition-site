import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Empty, ErrorNote, Page, Panel, Section, Spinner, Stat, Table, btn, inputCls, useLoad } from './ui';
import { api, downloadCsv, fcfa, monthLabel } from './api';

const PERIODS = [
  { value: 'month', label: 'Ce mois-ci' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: 'year', label: 'Cette année' },
  { value: 'all', label: 'Depuis le début' },
  { value: 'custom', label: 'Période personnalisée' },
];

const iso = (d) => d.toISOString().slice(0, 10);
function range(period, custom) {
  const now = new Date();
  const from = new Date(now);
  if (period === 'month') { from.setUTCDate(1); return { from: iso(from), to: iso(now) }; }
  if (period === '30d') { from.setUTCDate(from.getUTCDate() - 29); return { from: iso(from), to: iso(now) }; }
  if (period === '90d') { from.setUTCDate(from.getUTCDate() - 89); return { from: iso(from), to: iso(now) }; }
  if (period === 'year') { return { from: `${now.getUTCFullYear()}-01-01`, to: iso(now) }; }
  if (period === 'custom') return { from: custom.from, to: custom.to };
  return { from: '', to: '' };
}

export default function Reports() {
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const { from, to } = range(period, custom);
  const report = useLoad(() => api(`/api/admin/v2/reports?from=${from}&to=${to}`), [from, to]);
  const r = report.data;

  const exportCsv = () => {
    const rows = [
      ['Période', from || 'début', to || "aujourd'hui"], [],
      ['Mois', 'Commandes', "Chiffre d'affaires (FCFA)"], ...r.months.map((m) => [m.month, m.orders, m.revenue]), [],
      ['Livre', 'Ebook vendus', 'CA ebook', 'Papier vendus', 'CA papier', 'CA total'],
      ...r.books.map((b) => [b.title, b.ebook_units, b.ebook_revenue, b.papier_units, b.papier_revenue, b.revenue]), [],
      ['Auteur', 'Ventes', 'Prix payés', 'Part auteur', 'Part NGU', 'Versé (total)', 'Reste à verser'],
      ...r.authors.map((a) => [a.name, a.sold, a.gross, a.author_share, a.ngu_share, a.paid, a.balance]),
    ];
    downloadCsv(`rapport-ventes-${iso(new Date())}.csv`, rows);
  };

  return (
    <Page
      title="Rapports"
      subtitle="Ventes payées, hors remboursements."
      actions={<button className={btn.ghost} onClick={exportCsv} disabled={!r}><Download className="w-4 h-4" /> Exporter</button>}
    >
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${inputCls} w-56`} aria-label="Période">
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {period === 'custom' && (
          <>
            <input type="date" className={`${inputCls} w-44`} value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} aria-label="Du" />
            <span className="text-sm text-[#7B8478]">au</span>
            <input type="date" className={`${inputCls} w-44`} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} aria-label="Au" />
          </>
        )}
      </div>

      <ErrorNote>{report.error}</ErrorNote>
      {report.loading || !r ? <Spinner /> : (
        <>
          <Panel className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#E4E1D8] mb-10">
            <Stat strong label="Chiffre d'affaires" value={fcfa(r.totals.revenue)} />
            <Stat label="Commandes" value={r.totals.orders} hint={r.totals.orders ? `Panier moyen : ${fcfa(Math.round(r.totals.revenue / r.totals.orders))}` : undefined} />
            <Stat label="Ebooks" value={fcfa(r.kinds.ebook.revenue)} hint={`${r.kinds.ebook.orders} vente${r.kinds.ebook.orders > 1 ? 's' : ''}`} />
            <Stat label="Livres papier" value={fcfa(r.kinds.papier.revenue)} hint={`${r.kinds.papier.orders} vente${r.kinds.papier.orders > 1 ? 's' : ''}`} />
          </Panel>

          <Section title="Par mois">
            {r.months.length === 0 ? <Panel><Empty>Aucune vente sur cette période.</Empty></Panel> : (
              <Table head={['Mois', { label: 'Commandes', right: true }, { label: "Chiffre d'affaires", right: true }]}>
                {r.months.map((m) => <tr key={m.month}><td className="px-4 py-3 capitalize">{monthLabel(m.month)}</td><td className="px-4 py-3 text-right">{m.orders}</td><td className="px-4 py-3 text-right font-medium whitespace-nowrap">{fcfa(m.revenue)}</td></tr>)}
              </Table>
            )}
          </Section>

          <Section title="Par livre">
            {r.books.length === 0 ? <Panel><Empty>Aucune vente sur cette période.</Empty></Panel> : (
              <Table head={['Livre', { label: 'Ebooks', right: true }, { label: 'Papier', right: true }, { label: "Chiffre d'affaires", right: true }]}>
                {r.books.map((b) => (
                  <tr key={b.book_id}>
                    <td className="px-4 py-3 font-medium">{b.title}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{b.ebook_units} · {fcfa(b.ebook_revenue)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{b.papier_units} · {fcfa(b.papier_revenue)}</td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{fcfa(b.revenue)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>

          {r.authors.length > 0 && (
            <Section title="Auteurs" hint="Ventes d'ebooks des livres d'auteurs sur la période ; le solde est celui d'aujourd'hui.">
              <Table head={['Auteur', { label: 'Ventes', right: true }, { label: 'Part auteur', right: true }, { label: 'Part NGU', right: true }, { label: 'Reste à verser', right: true }]}>
                {r.authors.map((a) => (
                  <tr key={a.name}>
                    <td className="px-4 py-3 font-medium">{a.name}</td><td className="px-4 py-3 text-right">{a.sold}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{fcfa(a.author_share)}</td><td className="px-4 py-3 text-right whitespace-nowrap">{fcfa(a.ngu_share)}</td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{fcfa(a.balance)}</td>
                  </tr>
                ))}
              </Table>
            </Section>
          )}
        </>
      )}
    </Page>
  );
}
