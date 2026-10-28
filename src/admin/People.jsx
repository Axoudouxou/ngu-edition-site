import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Chips, Drawer, Empty, ErrorNote, Field, Page, Panel, Section, Spinner, Table, btn, inputCls, useLoad } from './ui';
import { api, fcfa, fmtDate, today } from './api';

/* ───────────── Auteurs ───────────── */

function AuthorDetail({ authorId, allBooks, onChanged }) {
  const [d, setD] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bookToAdd, setBookToAdd] = useState('');
  const [payout, setPayout] = useState({ amount: '', date: today(), note: '' });

  const load = useCallback(async () => {
    const data = await api(`/api/admin/authors/${authorId}`);
    setD(data);
    setForm({ name: data.author.name, email: data.author.email, payout_phone: data.author.payout_phone, commission_percent: data.author.commission_percent });
  }, [authorId]);
  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); await load(); onChanged(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (!d || !form) return error ? <ErrorNote>{error}</ErrorNote> : <Spinner />;
  const assigned = d.books.map((b) => b.book_id);
  const available = allBooks.filter((b) => !assigned.includes(b.id));
  const base = `/api/admin/authors/${authorId}`;

  return (
    <div className="space-y-8">
      <ErrorNote>{error}</ErrorNote>
      <div className="grid grid-cols-3 gap-px bg-[#E4E1D8] border border-[#E4E1D8] rounded-lg overflow-hidden text-center">
        {[['Gagné', d.author.earned], ['Déjà versé', d.author.paid], ['Reste à verser', d.author.balance]].map(([l, v]) => (
          <div key={l} className="bg-white py-3"><p className="text-[10px] uppercase tracking-[0.1em] text-[#7B8478]">{l}</p><p className="font-editorial text-xl text-[#20392D]">{fcfa(v)}</p></div>
        ))}
      </div>

      <Section title="Informations">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nom"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email de connexion"><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Mobile Money pour les versements"><input className={inputCls} value={form.payout_phone} onChange={(e) => setForm({ ...form, payout_phone: e.target.value })} /></Field>
          <Field label="Commission NGU (%)" hint="Ne change pas les ventes déjà enregistrées."><input type="number" className={inputCls} value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} /></Field>
        </div>
        <div className="flex gap-3 mt-4">
          <button className={btn.primary} disabled={busy} onClick={() => run(() => api(base, { method: 'PUT', body: form }))}>Enregistrer</button>
          <button className={btn.ghost} disabled={busy} onClick={() => run(() => api(base, { method: 'PUT', body: { active: !d.author.active } }))}>{d.author.active ? "Désactiver l'accès" : "Réactiver l'accès"}</button>
        </div>
      </Section>

      <Section title="Livres" hint="Seules les ventes faites après le rattachement sont comptées pour l'auteur.">
        <ul className="space-y-2 mb-3">
          {d.books.length === 0 && <li className="text-sm text-[#7B8478]">Aucun livre rattaché.</li>}
          {d.books.map((b) => (
            <li key={b.book_id} className="flex items-center justify-between text-sm bg-[#F7F6F2] rounded-md px-3 py-2">
              <span>{b.title}</span>
              <button className={btn.danger} onClick={() => run(() => api(`${base}/books/${b.book_id}`, { method: 'DELETE' }))}>Retirer</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <select className={inputCls} value={bookToAdd} onChange={(e) => setBookToAdd(e.target.value)}>
            <option value="">Choisir un livre…</option>
            {available.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <button className={btn.ghost} disabled={busy || !bookToAdd} onClick={() => run(async () => { await api(`${base}/books`, { method: 'POST', body: { book_id: bookToAdd } }); setBookToAdd(''); })}>Rattacher</button>
        </div>
      </Section>

      <Section title="Versements">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Montant (FCFA)"><input type="number" className={inputCls} value={payout.amount} onChange={(e) => setPayout({ ...payout, amount: e.target.value })} /></Field>
          <Field label="Date"><input type="date" className={inputCls} value={payout.date} onChange={(e) => setPayout({ ...payout, date: e.target.value })} /></Field>
          <Field label="Note"><input className={inputCls} value={payout.note} onChange={(e) => setPayout({ ...payout, note: e.target.value })} placeholder="ex : octobre" /></Field>
        </div>
        <button className={`${btn.primary} mt-3`} disabled={busy || !payout.amount} onClick={() => run(async () => { await api(`${base}/payouts`, { method: 'POST', body: payout }); setPayout({ amount: '', date: today(), note: '' }); })}>Enregistrer le versement</button>
        <ul className="mt-4 space-y-1.5">
          {d.payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span>{fmtDate(p.date)} · {fcfa(p.amount)}{p.note ? ` · ${p.note}` : ''}</span>
              <button aria-label="Supprimer ce versement" className="text-[#A33B2F]" onClick={() => run(() => api(`${base}/payouts/${p.id}`, { method: 'DELETE' }))}><Trash2 className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Dernières ventes" hint="« Annuler » retire une vente de test du solde de l'auteur.">
        <Table head={['Date', 'Livre', { label: 'Payé', right: true }, { label: 'Auteur', right: true }, { label: 'NGU', right: true }, '']}>
          {d.sales.length === 0 && <tr><td colSpan={6}><Empty>Aucune vente pour l'instant.</Empty></td></tr>}
          {d.sales.map((s) => (
            <tr key={s.reference} className={s.voided ? 'opacity-50 line-through' : ''}>
              <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(s.date)}</td><td className="px-4 py-2.5">{s.title}</td>
              <td className="px-4 py-2.5 text-right whitespace-nowrap">{fcfa(s.gross)}</td><td className="px-4 py-2.5 text-right whitespace-nowrap">{fcfa(s.earned)}</td><td className="px-4 py-2.5 text-right whitespace-nowrap">{fcfa(s.ngu)}</td>
              <td className="px-4 py-2.5 text-right no-underline"><button className={btn.link} onClick={() => run(() => api(`/api/admin/author-sales/${encodeURIComponent(s.reference)}/void`, { method: 'POST', body: { voided: !s.voided } }))}>{s.voided ? 'Rétablir' : 'Annuler'}</button></td>
            </tr>
          ))}
        </Table>
      </Section>
    </div>
  );
}

function NewAuthor({ defaultCommission, onCreated }) {
  const [f, setF] = useState({ name: '', email: '', payout_phone: '', commission_percent: defaultCommission });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { const r = await api('/api/admin/authors', { method: 'POST', body: f }); onCreated(r.id); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote>{error}</ErrorNote>
      <Field label="Nom"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Email" hint="C'est avec cette adresse que l'auteur se connecte : il reçoit un lien sur nguedition.com/auteur."><input type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Mobile Money pour les versements"><input className={inputCls} value={f.payout_phone} onChange={(e) => setF({ ...f, payout_phone: e.target.value })} /></Field>
      <Field label="Commission NGU (%)"><input type="number" className={inputCls} value={f.commission_percent} onChange={(e) => setF({ ...f, commission_percent: e.target.value })} /></Field>
      <button className={btn.primary} disabled={busy || !f.name || !f.email}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Ajouter l'auteur</button>
    </form>
  );
}

function AuthorsTab() {
  const authors = useLoad(() => api('/api/admin/authors'));
  const books = useLoad(() => api('/api/admin/books'));
  const settings = useLoad(() => api('/api/admin/v2/settings'));
  const [open, setOpen] = useState(null); // id, 'new'

  return (
    <>
      <div className="flex justify-end mb-4"><button className={btn.primary} onClick={() => setOpen('new')}><Plus className="w-4 h-4" /> Nouvel auteur</button></div>
      <ErrorNote>{authors.error}</ErrorNote>
      {authors.loading ? <Spinner /> : (authors.data || []).length === 0 ? (
        <Panel><Empty>Aucun auteur pour l'instant.</Empty></Panel>
      ) : (
        <Table head={['Auteur', { label: 'Livres', right: true }, { label: 'Vendus', right: true }, { label: 'Gagné', right: true }, { label: 'Versé', right: true }, { label: 'Reste à verser', right: true }]}>
          {authors.data.map((a) => (
            <tr key={a.id} onClick={() => setOpen(a.id)} className="cursor-pointer hover:bg-[#FAF9F5]">
              <td className="px-4 py-3"><p className="font-medium">{a.name} {!a.active && <Badge tone="grey">Accès désactivé</Badge>}</p><p className="text-xs text-[#7B8478]">{a.email}</p></td>
              <td className="px-4 py-3 text-right">{a.books_count}</td><td className="px-4 py-3 text-right">{a.sold}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{fcfa(a.earned)}</td><td className="px-4 py-3 text-right whitespace-nowrap">{fcfa(a.paid)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{fcfa(a.balance)}</td>
            </tr>
          ))}
        </Table>
      )}
      <Drawer open={open !== null} onClose={() => setOpen(null)} title={open === 'new' ? 'Nouvel auteur' : (authors.data || []).find((a) => a.id === open)?.name || 'Auteur'} wide={open !== 'new'}>
        {open === 'new' && settings.data && <NewAuthor defaultCommission={settings.data.default_commission_percent} onCreated={(id) => { authors.reload(); setOpen(id); }} />}
        {open !== null && open !== 'new' && <AuthorDetail key={open} authorId={open} allBooks={books.data || []} onChanged={authors.reload} />}
      </Drawer>
    </>
  );
}

/* ───────────── Maisons partenaires ───────────── */

function HouseForm({ house, onDone }) {
  const isNew = !house;
  const [f, setF] = useState({ name: house?.name || '', description: house?.description || '', website: house?.website || '', contact: house?.contact || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true); setError('');
    try {
      if (isNew) await api('/api/admin/v2/publishers', { method: 'POST', body: f });
      else await api(`/api/admin/v2/publishers/${encodeURIComponent(house.name)}`, { method: 'PUT', body: f });
      onDone();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm('Supprimer cette maison ?')) return;
    setBusy(true); setError('');
    try { await api(`/api/admin/v2/publishers/${encodeURIComponent(house.name)}`, { method: 'DELETE' }); onDone(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <ErrorNote>{error}</ErrorNote>
      {isNew && <Field label="Nom de la maison d'édition"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>}
      <Field label="Présentation"><textarea className={`${inputCls} min-h-[90px]`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Site web"><input className={inputCls} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" /></Field>
      <Field label="Contact (nom, téléphone, email)"><input className={inputCls} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
      {!isNew && (
        <Section title="Livres de cette maison" hint="Pour rattacher un livre à cette maison, renseigne sa « Maison d'édition » dans le Catalogue.">
          <ul className="space-y-1.5 text-sm">{house.books.length === 0 ? <li className="text-[#7B8478]">Aucun livre pour l'instant.</li> : house.books.map((b) => <li key={b.id}>{b.title}</li>)}</ul>
        </Section>
      )}
      <div className="flex items-center gap-4 pt-2">
        <button className={btn.primary} disabled={busy || (isNew && !f.name.trim())} onClick={save}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} {isNew ? 'Ajouter la maison' : 'Enregistrer'}</button>
        {!isNew && <button className={`${btn.danger} ml-auto`} onClick={remove}>Supprimer</button>}
      </div>
    </div>
  );
}

function PartnersTab() {
  const houses = useLoad(() => api('/api/admin/v2/publishers'));
  const [open, setOpen] = useState(null); // 'new' | house name
  const current = (houses.data || []).find((h) => h.name === open);
  const done = () => { setOpen(null); houses.reload(); };

  return (
    <>
      <div className="flex justify-end mb-4"><button className={btn.primary} onClick={() => setOpen('new')}><Plus className="w-4 h-4" /> Nouvelle maison</button></div>
      <ErrorNote>{houses.error}</ErrorNote>
      {houses.loading ? <Spinner /> : (houses.data || []).length === 0 ? (
        <Panel><Empty>Aucune maison partenaire pour l'instant. Les livres de NGU Édition n'y figurent pas.</Empty></Panel>
      ) : (
        <Table head={['Maison', { label: 'Livres', right: true }, { label: 'Vendus', right: true }, { label: "Chiffre d'affaires", right: true }]}>
          {houses.data.map((h) => (
            <tr key={h.name} onClick={() => setOpen(h.name)} className="cursor-pointer hover:bg-[#FAF9F5]">
              <td className="px-4 py-3"><p className="font-medium">{h.name}</p>{h.contact && <p className="text-xs text-[#7B8478]">{h.contact}</p>}</td>
              <td className="px-4 py-3 text-right">{h.books.length}</td><td className="px-4 py-3 text-right">{h.sold}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{fcfa(h.revenue)}</td>
            </tr>
          ))}
        </Table>
      )}
      <Drawer open={open !== null} onClose={() => setOpen(null)} title={open === 'new' ? 'Nouvelle maison' : open || ''}>
        {open === 'new' && <HouseForm onDone={done} />}
        {current && <HouseForm key={current.name} house={current} onDone={done} />}
      </Drawer>
    </>
  );
}

export default function People() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') === 'maisons' ? 'maisons' : 'auteurs';
  return (
    <Page title="Auteurs et partenaires" subtitle="Les ventes, les commissions et les versements, auteur par auteur, et les maisons d'édition partenaires.">
      <div className="mb-6">
        <Chips value={tab} onChange={(v) => setParams(v === 'maisons' ? { onglet: 'maisons' } : {})} options={[{ value: 'auteurs', label: 'Auteurs' }, { value: 'maisons', label: "Maisons d'édition" }]} />
      </div>
      {tab === 'auteurs' ? <AuthorsTab /> : <PartnersTab />}
    </Page>
  );
}
