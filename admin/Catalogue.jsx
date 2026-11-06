import React, { useState } from 'react';
import { CheckCircle, FileText, Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge, Chips, Drawer, Empty, ErrorNote, Field, Page, Panel, SearchBox, Section, Spinner, Table, btn, inputCls, useLoad } from './ui';
import { api, fcfa, slugify, upload } from './api';
import { isNguBook, publisherLabel } from '@/lib/publisher';

const EMPTY = {
  id: '', title: '', author: '', tagline: '', description: '', coverSrc: '', amazonUrl: '',
  ebookPriceFCFA: 5000, physiquePriceFCFA: 0, isEbook: true, points: [], testimonials: [], formats: [], publisher: 'NGU Édition',
};

function uniqueId(title, books) {
  const base = slugify(title) || 'livre';
  let id = base;
  let n = 2;
  while (books.some((b) => b.id === id)) id = `${base}-${n++}`;
  return id;
}

function BookEditor({ initial, books, publishers, onSaved, onDeleted }) {
  const [b, setB] = useState({ ...initial });
  const [isNew, setIsNew] = useState(!initial.id);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busyFile, setBusyFile] = useState('');
  const set = (k, v) => setB((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!b.title.trim()) { setError('Le titre est obligatoire.'); return; }
    setSaving(true);
    setError('');
    try {
      const id = b.id || uniqueId(b.title, books);
      const payload = { ...b, id, points: (b.points || []).filter((p) => p.trim()), testimonials: (b.testimonials || []).filter((t) => t.text.trim()) };
      await api('/api/admin/books', { method: 'POST', body: payload });
      await api(`/api/admin/books/${id}/publisher`, { method: 'PUT', body: { publisher: payload.publisher || '' } });
      setB(payload);
      setIsNew(false);
      setMsg('Enregistré');
      setTimeout(() => setMsg(''), 2500);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const sendFile = async (kind, file) => {
    if (!file || !b.id) return;
    setBusyFile(kind);
    setError('');
    try {
      const data = await upload(`/api/admin/books/${b.id}/upload-${kind}`, file);
      if (kind === 'cover' && data.cover_url) set('coverSrc', data.cover_url);
      if (kind === 'ebook') set('hasEbookFile', true);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyFile('');
    }
  };

  const remove = async () => {
    if (!confirm('Supprimer ce livre définitivement ?')) return;
    try {
      await api(`/api/admin/books/${b.id}`, { method: 'DELETE' });
      onDeleted();
    } catch (e) {
      setError(e.message);
    }
  };

  const houseNames = [...new Set(['NGU Édition', ...publishers])];

  return (
    <div className="space-y-8">
      <ErrorNote>{error}</ErrorNote>

      <div className="space-y-4">
        <Field label="Titre"><input className={inputCls} value={b.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Auteur"><input className={inputCls} value={b.author} onChange={(e) => set('author', e.target.value)} /></Field>
          <Field label="Maison d'édition" hint="NGU Édition pour un livre publié par NGU, sinon le nom de la maison partenaire.">
            <input className={inputCls} list="ngu-houses" value={b.publisher || ''} onChange={(e) => set('publisher', e.target.value)} />
            <datalist id="ngu-houses">{houseNames.map((n) => <option key={n} value={n} />)}</datalist>
          </Field>
        </div>
        <Field label="Accroche"><input className={inputCls} value={b.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
        <Field label="Description" hint="Sépare les paragraphes par une ligne vide.">
          <textarea className={`${inputCls} min-h-[150px]`} value={b.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </div>

      <Section title="Prix">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Prix de l'ebook (FCFA)"><input type="number" className={inputCls} value={b.ebookPriceFCFA} onChange={(e) => set('ebookPriceFCFA', Number(e.target.value))} /></Field>
          <Field label="Prix du livre papier (FCFA)" hint="Mets 0 s'il n'y a pas de version papier."><input type="number" className={inputCls} value={b.physiquePriceFCFA} onChange={(e) => set('physiquePriceFCFA', Number(e.target.value))} /></Field>
        </div>
        <div className="mt-4">
          <Field label="Lien Amazon (pour les lecteurs hors d'Afrique)"><input className={inputCls} value={b.amazonUrl} onChange={(e) => set('amazonUrl', e.target.value)} placeholder="Facultatif" /></Field>
        </div>
      </Section>

      <Section title="Couverture et fichier" hint={isNew ? "Enregistre d'abord le livre pour pouvoir envoyer la couverture et le fichier." : undefined}>
        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-4">
            {b.coverSrc ? <img src={b.coverSrc} alt="Couverture" className="w-16 h-24 object-cover rounded border border-[#E4E1D8]" /> : <div className="w-16 h-24 rounded border border-dashed border-[#D9D5C9]" />}
            <label className={`${btn.ghost} ${isNew ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
              {busyFile === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {b.coverSrc ? 'Changer la couverture' : 'Ajouter la couverture'}
              <input type="file" accept="image/*" className="hidden" disabled={isNew} onChange={(e) => sendFile('cover', e.target.files?.[0])} />
            </label>
          </div>
          <div>
            <label className={`${btn.ghost} ${isNew ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
              {busyFile === 'ebook' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {b.hasEbookFile ? "Remplacer le fichier de l'ebook" : "Envoyer le fichier de l'ebook"}
              <input type="file" accept=".pdf,.epub" className="hidden" disabled={isNew} onChange={(e) => sendFile('ebook', e.target.files?.[0])} />
            </label>
            <p className={`text-xs mt-2 ${b.hasEbookFile ? 'text-[#20392D]' : 'text-[#8A5F1F]'}`}>{b.hasEbookFile ? 'Fichier en ligne (PDF ou EPUB)' : 'Aucun fichier : les acheteurs ne pourraient pas le télécharger.'}</p>
          </div>
        </div>
      </Section>

      <Section title="Points forts" actions={<button className={btn.link} onClick={() => set('points', [...(b.points || []), ''])}>Ajouter</button>}>
        <div className="space-y-2">
          {(b.points || []).length === 0 && <p className="text-xs text-[#7B8478]">Aucun point fort.</p>}
          {(b.points || []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} value={p} onChange={(e) => set('points', b.points.map((x, j) => (j === i ? e.target.value : x)))} />
              <button aria-label="Retirer" className="text-[#A33B2F]" onClick={() => set('points', b.points.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Témoignages de lecteurs" actions={<button className={btn.link} onClick={() => set('testimonials', [...(b.testimonials || []), { text: '', author: '' }])}>Ajouter</button>}>
        <div className="space-y-3">
          {(b.testimonials || []).length === 0 && <p className="text-xs text-[#7B8478]">Aucun témoignage.</p>}
          {(b.testimonials || []).map((t, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <textarea className={`${inputCls} min-h-[64px]`} placeholder="Témoignage" value={t.text} onChange={(e) => set('testimonials', b.testimonials.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                <input className={inputCls} placeholder="Nom du lecteur" value={t.author} onChange={(e) => set('testimonials', b.testimonials.map((x, j) => (j === i ? { ...x, author: e.target.value } : x)))} />
              </div>
              <button aria-label="Retirer" className="text-[#A33B2F] mt-2" onClick={() => set('testimonials', b.testimonials.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-4 pt-5 border-t border-[#E4E1D8]">
        <button className={btn.primary} onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer</button>
        {msg && <span className="text-sm text-[#20392D] inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {msg}</span>}
        {!isNew && <button className={`${btn.danger} ml-auto`} onClick={remove}>Supprimer ce livre</button>}
      </div>
    </div>
  );
}

export default function Catalogue() {
  const books = useLoad(() => api('/api/admin/books'));
  const houses = useLoad(() => api('/api/admin/v2/publishers'));
  const [q, setQ] = useState('');
  const [who, setWho] = useState('all');
  const [editing, setEditing] = useState(null);

  const list = (books.data || []).filter((b) => {
    if (who === 'ngu' && !isNguBook(b)) return false;
    if (who === 'partners' && isNguBook(b)) return false;
    const hay = `${b.title} ${b.author} ${b.publisher || ''}`.toLowerCase();
    return q.trim().split(/\s+/).every((p) => hay.includes(p.toLowerCase()));
  });

  return (
    <Page
      title="Catalogue"
      subtitle="Tous les livres en vente sur la librairie."
      actions={<button className={btn.primary} onClick={() => setEditing({ ...EMPTY })}><Plus className="w-4 h-4" /> Nouveau livre</button>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1"><SearchBox value={q} onChange={setQ} placeholder="Rechercher un titre, un auteur, une maison" /></div>
        <Chips value={who} onChange={setWho} options={[{ value: 'all', label: 'Tous' }, { value: 'ngu', label: 'NGU' }, { value: 'partners', label: 'Partenaires' }]} />
      </div>

      <ErrorNote>{books.error}</ErrorNote>
      {books.loading ? <Spinner /> : list.length === 0 ? (
        <Panel><Empty>{(books.data || []).length ? 'Aucun livre ne correspond à cette recherche.' : "Aucun livre pour l'instant."}</Empty></Panel>
      ) : (
        <Table head={['', 'Livre', 'Maison', { label: 'Ebook', right: true }, { label: 'Papier', right: true }, 'Fichier ebook']}>
          {list.map((b) => (
            <tr key={b.id} onClick={() => setEditing({ ...b })} className="cursor-pointer hover:bg-[#FAF9F5]">
              <td className="px-4 py-3 w-14">{b.coverSrc ? <img src={b.coverSrc} alt="" className="w-9 h-[54px] object-cover rounded-sm border border-[#E4E1D8]" /> : <div className="w-9 h-[54px] rounded-sm border border-dashed border-[#D9D5C9]" />}</td>
              <td className="px-4 py-3"><p className="font-medium">{b.title || '(sans titre)'}</p><p className="text-xs text-[#7B8478]">{b.author}</p></td>
              <td className="px-4 py-3 text-[#4B5A51]">{publisherLabel(b)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{b.isEbook === false ? '—' : fcfa(b.ebookPriceFCFA)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{Number(b.physiquePriceFCFA) > 0 ? fcfa(b.physiquePriceFCFA) : '—'}</td>
              <td className="px-4 py-3">{b.isEbook === false ? <span className="text-[#8A9188]">—</span> : b.hasEbookFile ? <Badge tone="green">En ligne</Badge> : <Badge tone="ochre">Manquant</Badge>}</td>
            </tr>
          ))}
        </Table>
      )}

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? editing.title || 'Livre' : 'Nouveau livre'} wide>
        {editing && (
          <BookEditor
            key={editing.id || 'new'}
            initial={editing}
            books={books.data || []}
            publishers={(houses.data || []).map((h) => h.name)}
            onSaved={() => { books.reload(); houses.reload(); }}
            onDeleted={() => { setEditing(null); books.reload(); }}
          />
        )}
      </Drawer>
    </Page>
  );
}
