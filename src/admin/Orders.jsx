import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Loader2, MessageCircle, Phone } from 'lucide-react';
import {
  Badge, Chips, Drawer, Empty, ErrorNote, FULFILLMENT, Page, Panel, SearchBox, Spinner, StatusBadge, Table, btn, inputCls,
} from './ui';
import { api, clientName, downloadCsv, fcfa, fmtDate, waLink } from './api';

const PERIODS = [
  { value: 'all', label: 'Toutes les dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: 'month', label: 'Ce mois-ci' },
];

function Row({ label, children }) {
  return (
    <div className="flex gap-4 py-2.5 text-sm border-b border-[#F0EEE7] last:border-0">
      <dt className="w-32 shrink-0 text-[#7B8478]">{label}</dt>
      <dd className="flex-1 text-[#20392D]">{children}</dd>
    </div>
  );
}

function OrderDetail({ reference, onChanged }) {
  const [o, setO] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api(`/api/admin/v2/orders/${encodeURIComponent(reference)}`);
      setO(data);
      setNote(data.note || '');
    } catch (e) {
      setError(e.message);
    }
  }, [reference]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const base = `/api/admin/v2/orders/${encodeURIComponent(reference)}`;

  if (error && !o) return <ErrorNote>{error}</ErrorNote>;
  if (!o) return <Spinner />;
  const d = o.delivery;

  return (
    <div>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex items-center gap-2 mb-5">
        <StatusBadge status={o.status} />
        {o.fulfillment && <Badge tone={FULFILLMENT[o.fulfillment].tone}>{FULFILLMENT[o.fulfillment].label}</Badge>}
        <span className="text-xs text-[#7B8478] ml-1">{fmtDate(o.date)}</span>
      </div>

      <dl className="mb-6">
        <Row label="Livre">{o.book_title}</Row>
        <Row label="Format">{o.kind === 'papier' ? 'Livre papier' : 'Ebook'}</Row>
        <Row label="Montant"><span className="font-medium">{fcfa(o.amount)}</span></Row>
        <Row label="Commande">{o.short}</Row>
      </dl>

      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F] mb-2">Client</h3>
      <dl className="mb-6">
        {d && <Row label="Nom">{`${d.first_name} ${d.last_name}`.trim() || '—'}</Row>}
        {d?.phone && (
          <Row label="Téléphone">
            <span>{d.phone}</span>
            <span className="inline-flex gap-3 ml-3 align-middle">
              <a href={waLink(d.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#8A5F1F] hover:underline"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</a>
              <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-xs text-[#8A5F1F] hover:underline"><Phone className="w-3.5 h-3.5" />Appeler</a>
            </span>
          </Row>
        )}
        <Row label="Email">{o.customer_email || '—'}</Row>
        {d && (
          <Row label="Adresse">
            {[d.address, d.district, d.city, d.country].filter(Boolean).join(', ') || '—'}
          </Row>
        )}
        {!d && o.kind === 'papier' && (
          <Row label="Coordonnées"><span className="text-[#7B8478]">Non enregistrées pour cette commande (passée avant la correction).</span></Row>
        )}
      </dl>

      {o.author && (
        <>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F] mb-2">Auteur</h3>
          <dl className="mb-6">
            <Row label="Auteur">{o.author.name}</Row>
            <Row label="Part de l'auteur">{fcfa(o.author.author_share)} <span className="text-[#7B8478]">({100 - o.author.rate}%)</span></Row>
            <Row label="Part NGU">{fcfa(o.author.ngu_share)} <span className="text-[#7B8478]">({o.author.rate}%)</span></Row>
          </dl>
        </>
      )}

      {o.fulfillment && (
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F] mb-2">Suivi de la livraison</h3>
          <Chips
            value={o.fulfillment}
            onChange={(v) => run(() => api(`${base}/fulfillment`, { method: 'POST', body: { status: v } }))}
            options={[{ value: 'a_livrer', label: 'À livrer' }, { value: 'livree', label: 'Livrée' }]}
          />
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F] mb-2">Note interne</h3>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} min-h-[80px]`} placeholder="Visible uniquement par l'équipe" />
        <button className={`${btn.ghost} mt-2`} disabled={busy || note === (o.note || '')} onClick={() => run(() => api(`${base}/note`, { method: 'POST', body: { note } }))}>
          Enregistrer la note
        </button>
      </div>

      {(o.status === 'paid' || o.status === 'refunded') && (
        <div className="border-t border-[#E4E1D8] pt-5">
          {o.status === 'paid' ? (
            <>
              <button
                className={btn.danger}
                disabled={busy}
                onClick={() => {
                  if (confirm("Marquer cette commande comme remboursée ? Elle sortira du chiffre d'affaires et, le cas échéant, du solde de l'auteur. Le remboursement lui-même se fait dans JEKO.")) {
                    run(() => api(`${base}/refund`, { method: 'POST', body: { refunded: true } }));
                  }
                }}
              >
                Marquer comme remboursée
              </button>
              <p className="text-xs text-[#7B8478] mt-1.5">À faire une fois le remboursement effectué dans JEKO.</p>
            </>
          ) : (
            <button className={btn.link} disabled={busy} onClick={() => run(() => api(`${base}/refund`, { method: 'POST', body: { refunded: false } }))}>
              Annuler le remboursement
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [kind, setKind] = useState('all');
  const [period, setPeriod] = useState('all');
  const [limit, setLimit] = useState(50);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(params.get('ref'));
  const [exporting, setExporting] = useState(false);

  const query = useCallback((extra = {}) => {
    const p = new URLSearchParams({ q: q.trim(), status, kind, period, limit: String(limit), ...extra });
    return `/api/admin/v2/orders?${p.toString()}`;
  }, [q, status, kind, period, limit]);

  const load = useCallback(async () => {
    try {
      setData(await api(query()));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => { setLimit(50); }, [q, status, kind, period]);

  const close = () => {
    setOpen(null);
    if (params.get('ref')) { params.delete('ref'); setParams(params, { replace: true }); }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await api(query({ limit: '500', offset: '0' }));
      downloadCsv(`commandes-${new Date().toISOString().slice(0, 10)}.csv`, [
        ['Date', 'Commande', 'Client', 'Email', 'Téléphone', 'Adresse', 'Ville', 'Livre', 'Format', 'Montant (FCFA)', 'Statut', 'Livraison'],
        ...all.items.map((o) => [
          o.date, o.short, clientName(o), o.customer_email, o.delivery?.phone || '',
          [o.delivery?.address, o.delivery?.district].filter(Boolean).join(', '), o.delivery?.city || '',
          o.book_title, o.kind, o.amount, ({ paid: 'Payée', pending: 'En attente', refunded: 'Remboursée' })[o.status] || o.status,
          o.fulfillment ? FULFILLMENT[o.fulfillment].label : '',
        ]),
      ]);
    } finally {
      setExporting(false);
    }
  };

  const c = data?.counts || {};
  const items = data?.items || [];

  return (
    <Page
      title="Commandes"
      subtitle="Les paiements non finalisés disparaissent d'eux-mêmes au bout de 24 heures."
      actions={<button className={btn.ghost} onClick={exportCsv} disabled={exporting || !items.length}>{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Exporter</button>}
    >
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><SearchBox value={q} onChange={setQ} placeholder="Rechercher un client, un téléphone, un livre, une commande" /></div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${inputCls} sm:w-52`} aria-label="Période">
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Chips value={status} onChange={setStatus} options={[
            { value: 'all', label: 'Toutes', count: c.all }, { value: 'paid', label: 'Payées', count: c.paid },
            { value: 'pending', label: 'En attente', count: c.pending }, { value: 'refunded', label: 'Remboursées', count: c.refunded },
            { value: 'to_deliver', label: 'À livrer', count: c.to_deliver },
          ]} />
          <Chips value={kind} onChange={setKind} options={[{ value: 'all', label: 'Tous formats' }, { value: 'ebook', label: 'Ebook' }, { value: 'papier', label: 'Papier' }]} />
        </div>
      </div>

      <ErrorNote>{error}</ErrorNote>
      {loading ? <Spinner /> : items.length === 0 ? (
        <Panel><Empty>{q || status !== 'all' || kind !== 'all' || period !== 'all' ? 'Aucune commande ne correspond à cette recherche.' : "Aucune commande pour l'instant."}</Empty></Panel>
      ) : (
        <>
          <Table head={['Date', 'Client', 'Livre', 'Format', { label: 'Montant', right: true }, 'Statut']}>
            {items.map((o) => (
              <tr key={o.reference} onClick={() => setOpen(o.reference)} className="cursor-pointer hover:bg-[#FAF9F5]">
                <td className="px-4 py-3 whitespace-nowrap text-[#6B7468]">{fmtDate(o.date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{clientName(o) || '—'}</p>
                  {o.delivery && <p className="text-xs text-[#7B8478]">{[o.delivery.phone, o.delivery.city].filter(Boolean).join(' · ')}</p>}
                </td>
                <td className="px-4 py-3">{o.book_title}</td>
                <td className="px-4 py-3 text-[#6B7468]">{o.kind === 'papier' ? 'Papier' : 'Ebook'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{fcfa(o.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={o.status} />
                    {o.fulfillment && <Badge tone={FULFILLMENT[o.fulfillment].tone}>{FULFILLMENT[o.fulfillment].label}</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <div className="flex items-center justify-between mt-4 text-xs text-[#7B8478]">
            <span>{items.length} sur {data.total} commande{data.total > 1 ? 's' : ''}</span>
            {items.length < data.total && <button className={btn.ghost} onClick={() => setLimit((l) => l + 50)}>Afficher plus</button>}
          </div>
        </>
      )}

      <Drawer open={!!open} onClose={close} title="Commande">
        {open && <OrderDetail key={open} reference={open} onChanged={load} />}
      </Drawer>
    </Page>
  );
}
