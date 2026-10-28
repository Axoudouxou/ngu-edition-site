import React from 'react';
import { Link } from 'react-router-dom';
import { Page, Section, Panel, Stat, Table, Badge, Spinner, ErrorNote, Empty, useLoad } from './ui';
import { api, clientName, fcfa, fmtDate, monthLabel } from './api';

function sixMonthsAgo() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 5);
  return d.toISOString().slice(0, 10);
}

async function loadLowStock() {
  const [books, rows, sold] = await Promise.all([
    api('/api/admin/books'),
    api('/api/admin/stock'),
    api('/api/admin/v2/stock-sold'),
  ]);
  const stock = Object.fromEntries(rows.map((r) => [r.format_id, r]));
  const low = [];
  books.forEach((b) => {
    const formats = (b.formats || []).filter((f) => f.category === 'physique');
    const list = formats.length ? formats : Number(b.physiquePriceFCFA) > 0 ? [{ id: `${b.id}-physique` }] : [];
    list.forEach((f) => {
      const s = stock[f.id];
      if (!s) return;
      const left = Number(s.quantity) - (sold[f.id]?.sold || 0);
      if (left <= Number(s.low_stock_threshold)) low.push({ id: f.id, title: b.title, left: Math.max(left, 0) });
    });
  });
  return low;
}

const short = (n) => (n >= 1000000 ? `${(n / 1000000).toFixed(1).replace('.', ',')} M` : n >= 1000 ? `${Math.round(n / 1000)} k` : String(n));

function Bars({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-3 h-48" role="img" aria-label="Chiffre d'affaires par mois">
      {data.map((d) => (
        <div key={d.name} className="flex-1 h-full flex flex-col justify-end items-center" title={`${d.name} : ${fcfa(d.revenue)}`}>
          <span className="text-[10px] text-[#7B8478] mb-1">{d.revenue ? short(d.revenue) : ''}</span>
          <div className="w-full max-w-[44px] bg-[#20392D] rounded-t" style={{ height: `${Math.max((d.revenue / max) * 80, d.revenue ? 2 : 0)}%` }} />
          <span className="text-[11px] mt-2 text-[#7B8478] capitalize">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const dash = useLoad(() => api('/api/admin/v2/dashboard'));
  const toDeliver = useLoad(() => api('/api/admin/v2/orders?status=to_deliver&limit=6'));
  const months = useLoad(() => api(`/api/admin/v2/reports?from=${sixMonthsAgo()}`));
  const low = useLoad(loadLowStock);

  const d = dash.data;
  if (dash.loading) return <Page title="Tableau de bord"><Spinner /></Page>;
  if (!d) return <Page title="Tableau de bord"><ErrorNote>{dash.error || 'Chargement impossible'}</ErrorNote></Page>;

  const chart = (months.data?.months || []).map((m) => ({ name: monthLabel(m.month).replace(/ \d{4}$/, ''), revenue: m.revenue }));

  return (
    <Page title="Tableau de bord" subtitle="Les chiffres ne comptent que les commandes payées, hors remboursements.">
      <Panel className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#E4E1D8] mb-3">
        <Stat strong label="Chiffre d'affaires du mois" value={fcfa(d.revenue.month)} />
        <Stat label="Total encaissé" value={fcfa(d.revenue.total)} hint={`Aujourd'hui : ${fcfa(d.revenue.today)}`} />
        <Stat label="Commandes payées" value={d.orders.paid} hint={`${d.by_kind.ebook.orders} ebook · ${d.by_kind.papier.orders} papier`} />
        <Stat label="Livraisons à faire" value={d.orders.to_deliver} />
      </Panel>
      <p className="text-xs text-[#7B8478] mb-10 px-1">
        {d.orders.pending} en attente de paiement
        {d.orders.refunded > 0 && <> · {d.orders.refunded} remboursée{d.orders.refunded > 1 ? 's' : ''}</>}
        {d.authors_due ? <> · {fcfa(d.authors_due)} à verser aux auteurs</> : null}
      </p>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10">
        <div>
          <Section title="Dernières ventes" actions={<Link to="/admin/commandes" className="text-xs font-medium text-[#8A5F1F] hover:underline">Toutes les commandes</Link>}>
            {d.recent.length === 0 ? (
              <Panel><Empty>Aucune vente pour l'instant.</Empty></Panel>
            ) : (
              <Table head={['Date', 'Livre', 'Client', { label: 'Montant', right: true }]}>
                {d.recent.map((o) => (
                  <tr key={o.reference} className="hover:bg-[#FAF9F5]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#6B7468]">{fmtDate(o.date)}</td>
                    <td className="px-4 py-3">{o.book_title} <span className="text-[#8A9188]">· {o.kind === 'papier' ? 'papier' : 'ebook'}</span></td>
                    <td className="px-4 py-3 text-[#4B5A51]">{o.customer || '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{fcfa(o.amount)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>

          <Section title="Ventes par mois">
            <Panel className="p-4">
              {chart.length === 0 ? <Empty>Pas encore de ventes.</Empty> : <Bars data={chart} />}
            </Panel>
          </Section>
        </div>

        <div>
          <Section title="À livrer" actions={<Link to="/admin/commandes?status=to_deliver" className="text-xs font-medium text-[#8A5F1F] hover:underline">Voir tout</Link>}>
            <Panel className="divide-y divide-[#F0EEE7]">
              {(toDeliver.data?.items || []).length === 0 && <Empty>Rien à livrer.</Empty>}
              {(toDeliver.data?.items || []).map((o) => (
                <Link key={o.reference} to={`/admin/commandes?ref=${encodeURIComponent(o.reference)}`} className="block px-4 py-3 hover:bg-[#FAF9F5]">
                  <p className="text-sm font-medium">{clientName(o) || '—'}</p>
                  <p className="text-xs text-[#6B7468] mt-0.5">{o.book_title}{o.delivery?.city ? ` · ${o.delivery.city}` : ''}</p>
                </Link>
              ))}
            </Panel>
          </Section>

          <Section title="Stock à surveiller">
            <Panel className="divide-y divide-[#F0EEE7]">
              {(low.data || []).length === 0 && <Empty>Aucun stock bas.</Empty>}
              {(low.data || []).map((l) => (
                <Link key={l.id} to="/admin/stock" className="flex items-center justify-between px-4 py-3 hover:bg-[#FAF9F5]">
                  <span className="text-sm">{l.title}</span>
                  <Badge tone={l.left === 0 ? 'red' : 'ochre'}>{l.left === 0 ? 'Épuisé' : `${l.left} restant${l.left > 1 ? 's' : ''}`}</Badge>
                </Link>
              ))}
            </Panel>
          </Section>
        </div>
      </div>
    </Page>
  );
}
