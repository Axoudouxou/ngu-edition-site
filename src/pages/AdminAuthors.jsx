import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAdminLoggedIn, adminFetch } from '@/lib/adminAuth';

const money = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const today = () => new Date().toISOString().slice(0, 10);

async function call(path, method = 'GET', body) {
  const res = await adminFetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

function AuthorDetail({ authorId, allBooks, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [bookToAdd, setBookToAdd] = useState('');
  const [payout, setPayout] = useState({ amount: '', date: today(), note: '' });

  const load = useCallback(async () => {
    const data = await call(`/api/admin/authors/${authorId}`);
    setD(data);
    setForm({
      name: data.author.name,
      email: data.author.email,
      payout_phone: data.author.payout_phone,
      commission_percent: data.author.commission_percent,
    });
  }, [authorId]);

  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

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

  if (!d || !form) return <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>;

  const assignedIds = d.books.map((b) => b.book_id);
  const available = allBooks.filter((b) => !assignedIds.includes(b.id));

  return (
    <div className="border-t border-border/40 pt-5 mt-4 space-y-8">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <section>
        <h3 className="font-medium text-primary mb-3">Informations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Email de connexion</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Numéro Mobile Money pour les versements</Label><Input value={form.payout_phone} onChange={(e) => setForm({ ...form, payout_phone: e.target.value })} /></div>
          <div><Label className="text-xs">Commission NGU (%)</Label><Input type="number" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} /></div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Changer la commission ne touche pas aux ventes déjà enregistrées, seulement aux suivantes.</p>
        <div className="flex gap-3 mt-3">
          <Button size="sm" disabled={busy} className="rounded-full bg-accent hover:bg-accent/90 text-white" onClick={() => run(() => call(`/api/admin/authors/${authorId}`, 'PUT', form))}>Enregistrer</Button>
          <Button size="sm" variant="outline" disabled={busy} className="rounded-full" onClick={() => run(() => call(`/api/admin/authors/${authorId}`, 'PUT', { active: !d.author.active }))}>
            {d.author.active ? "Désactiver l'accès" : "Réactiver l'accès"}
          </Button>
        </div>
      </section>

      <section>
        <h3 className="font-medium text-primary mb-3">Livres de cet auteur</h3>
        <ul className="space-y-2 mb-3">
          {d.books.map((b) => (
            <li key={b.book_id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
              <span>{b.title}</span>
              <button className="text-xs text-destructive/70 hover:text-destructive" onClick={() => run(() => call(`/api/admin/authors/${authorId}/books/${b.book_id}`, 'DELETE'))}>Retirer</button>
            </li>
          ))}
          {d.books.length === 0 && <li className="text-sm text-muted-foreground">Aucun livre rattaché.</li>}
        </ul>
        <div className="flex gap-2">
          <select value={bookToAdd} onChange={(e) => setBookToAdd(e.target.value)} className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Choisir un livre…</option>
            {available.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <Button size="sm" variant="outline" disabled={busy || !bookToAdd} className="rounded-full" onClick={() => run(async () => { await call(`/api/admin/authors/${authorId}/books`, 'POST', { book_id: bookToAdd }); setBookToAdd(''); })}>Rattacher</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Seules les ventes faites après le rattachement sont comptées pour l'auteur. Rattachez le livre quand il est prêt à la vente.</p>
      </section>

      <section>
        <h3 className="font-medium text-primary mb-3">Enregistrer un versement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><Label className="text-xs">Montant (FCFA)</Label><Input type="number" value={payout.amount} onChange={(e) => setPayout({ ...payout, amount: e.target.value })} /></div>
          <div><Label className="text-xs">Date</Label><Input type="date" value={payout.date} onChange={(e) => setPayout({ ...payout, date: e.target.value })} /></div>
          <div><Label className="text-xs">Note</Label><Input value={payout.note} onChange={(e) => setPayout({ ...payout, note: e.target.value })} placeholder="ex : octobre" /></div>
        </div>
        <Button size="sm" disabled={busy || !payout.amount} className="rounded-full bg-accent hover:bg-accent/90 text-white mt-3"
          onClick={() => run(async () => { await call(`/api/admin/authors/${authorId}/payouts`, 'POST', payout); setPayout({ amount: '', date: today(), note: '' }); })}>
          Enregistrer le versement
        </Button>
        {d.payouts.length > 0 && (
          <ul className="mt-4 space-y-1">
            {d.payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.date} — {money(p.amount)}{p.note ? ` (${p.note})` : ''}</span>
                <button aria-label="Supprimer ce versement" className="text-destructive/60 hover:text-destructive" onClick={() => run(() => call(`/api/admin/authors/${authorId}/payouts/${p.id}`, 'DELETE'))}><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-medium text-primary mb-3">Dernières ventes</h3>
        <div className="bg-white border border-border/50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Livre</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-right">Payé</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-right">Auteur</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-right">NGU</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {d.sales.map((s) => (
                <tr key={s.reference} className={`border-t border-border/30 ${s.voided ? 'opacity-50 line-through' : ''}`}>
                  <td className="px-3 py-2">{s.date}</td>
                  <td className="px-3 py-2">{s.title}</td>
                  <td className="px-3 py-2 text-right">{money(s.gross)}</td>
                  <td className="px-3 py-2 text-right">{money(s.earned)}</td>
                  <td className="px-3 py-2 text-right">{money(s.ngu)}</td>
                  <td className="px-3 py-2 text-right no-underline">
                    <button className="text-xs text-accent hover:underline" onClick={() => run(() => call(`/api/admin/author-sales/${encodeURIComponent(s.reference)}/void`, 'POST', { voided: !s.voided }))}>
                      {s.voided ? 'Rétablir' : 'Annuler'}
                    </button>
                  </td>
                </tr>
              ))}
              {d.sales.length === 0 && <tr><td colSpan={6} className="px-3 py-5 text-center text-muted-foreground">Aucune vente pour l'instant</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">« Annuler » sert pour un achat de test ou un remboursement : la vente sort du solde de l'auteur.</p>
      </section>
    </div>
  );
}

export default function AdminAuthors() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [books, setBooks] = useState([]);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', payout_phone: '', commission_percent: 15 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(() => call('/api/admin/authors').then(setAuthors).catch((e) => setError(e.message)), []);

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin/login'); return; }
    loadList();
    call('/api/admin/books').then(setBooks).catch(() => {});
  }, [navigate, loadList]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await call('/api/admin/authors', 'POST', form);
      setForm({ name: '', email: '', payout_phone: '', commission_percent: 15 });
      await loadList();
      setOpen(r.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>
      <h1 className="font-serif text-3xl font-semibold text-primary mb-2">Auteurs</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Pour se connecter, l'auteur va sur nguedition.com/auteur et saisit son email : il reçoit un lien.
      </p>

      <form onSubmit={create} className="bg-white border border-border/50 rounded-xl p-5 mb-8">
        <h2 className="font-medium text-primary mb-3">Ajouter un auteur</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Numéro Mobile Money (versements)</Label><Input value={form.payout_phone} onChange={(e) => setForm({ ...form, payout_phone: e.target.value })} /></div>
          <div><Label className="text-xs">Commission NGU (%)</Label><Input type="number" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} /></div>
        </div>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        <Button type="submit" size="sm" disabled={busy || !form.name || !form.email} className="rounded-full bg-accent hover:bg-accent/90 text-white mt-4">Ajouter</Button>
      </form>

      <div className="space-y-3">
        {authors.map((a) => (
          <div key={a.id} className="bg-white border border-border/50 rounded-xl p-5">
            <button className="w-full flex items-center justify-between text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
              <div>
                <p className="font-medium text-primary">{a.name}{!a.active && <span className="ml-2 text-xs text-muted-foreground">(accès désactivé)</span>}</p>
                <p className="text-xs text-muted-foreground">{a.email} · {a.books_count} livre{a.books_count > 1 ? 's' : ''} · {a.sold} vendu{a.sold > 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">À verser</p>
                <p className="font-semibold text-primary">{money(a.balance)}</p>
              </div>
            </button>
            {open === a.id && <AuthorDetail authorId={a.id} allBooks={books} onChanged={loadList} />}
          </div>
        ))}
        {authors.length === 0 && <p className="text-sm text-muted-foreground">Aucun auteur pour l'instant.</p>}
      </div>
    </div>
  );
}
