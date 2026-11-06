import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { useSiteContent } from '@/hooks/useSiteContent';

const STORAGE_KEY = 'ngu_catalog_request';
const MAX_TITLES = 40;
const MAX_QTY = 20;
const PAGE = 40;
const LEVELS = ['PS', 'MS', 'GS', 'CP', 'CE', 'CM', '6e', '5e', '4e', '3e', '2nde', '1ère', 'Tle'];

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

function levelsOf(item) {
  const fromAlso = (item.also_in.match(/\(([^)]+)\)/g) || []).join(' ');
  const tokens = `${item.level} ${fromAlso}`.split(/[\s/(),]+/);
  return LEVELS.filter((l) => tokens.includes(l));
}

function loadRequest() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (_) { return {}; }
}
function saveRequest(request) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(request)); } catch (_) { /* navigation privée : la demande reste en mémoire */ }
}

const FIELD = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

/** Quand la recherche ne trouve rien : le visiteur décrit le livre et nous l'envoie sur WhatsApp. */
function MissingBook({ initialTitle, whatsappUrl }) {
  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState('');
  const [details, setDetails] = useState('');
  useEffect(() => { setTitle(initialTitle); }, [initialTitle]);

  const message = [
    "Bonjour, je cherche un livre qui n'est pas dans votre catalogue :", '',
    `- Titre : ${title.trim()}`,
    ...(author.trim() ? [`- Auteur ou éditeur : ${author.trim()}`] : []),
    ...(details.trim() ? [`- Précisions : ${details.trim()}`] : []),
    '', 'Pouvez-vous me dire si vous pouvez le commander, à quel prix et sous quel délai ?',
  ].join('\n');
  const link = `${whatsappUrl}${whatsappUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;
  const ready = title.trim().length > 0;

  return (
    <section aria-labelledby="missing-title" className="max-w-xl mx-auto rounded-2xl border border-border/60 bg-white p-6">
      <h2 id="missing-title" className="font-serif text-xl font-semibold text-primary mb-2">Vous ne trouvez pas votre livre ?</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Faites une demande : nous cherchons le livre pour vous et nous vous répondons sur WhatsApp avec le prix et le délai.
      </p>
      <div className="space-y-3 mb-5">
        <label className="block text-sm">Titre du livre
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${FIELD} mt-1.5`} />
        </label>
        <label className="block text-sm">Auteur ou éditeur (facultatif)
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className={`${FIELD} mt-1.5`} />
        </label>
        <label className="block text-sm">Précisions, par exemple la classe ou l'édition (facultatif)
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} className={`${FIELD} mt-1.5`} />
        </label>
      </div>
      <a href={ready ? link : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!ready}
         className={`flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-6 py-3.5 hover:bg-primary/90 transition-colors ${ready ? '' : 'pointer-events-none opacity-50'}`}>
        <MessageCircle className="w-5 h-5" /> Envoyer ma demande sur WhatsApp
      </a>
      <p className="text-xs text-foreground/70 text-center mt-3">Aucun paiement maintenant.</p>
    </section>
  );
}

export default function Catalogue() {
  const { items, loading, error } = useCatalog();
  const content = useSiteContent();
  const whatsappUrl = content.contact_whatsapp_url || 'https://wa.me/2250703829289';

  const [q, setQ] = useState('');
  const [catalogue, setCatalogue] = useState('');
  const [rubrique, setRubrique] = useState('');
  const [level, setLevel] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [request, setRequest] = useState(loadRequest); // { code: quantité }
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => { saveRequest(request); }, [request]);

  const index = useMemo(() => items.map((i) => ({ ...i, hay: norm(`${i.title} ${i.code} ${i.collection} ${i.rubrique} ${i.sous_rubrique} ${i.audience}`), levels: levelsOf(i) })), [items]);
  const byCode = useMemo(() => Object.fromEntries(index.map((i) => [i.code, i])), [index]);
  const catalogues = useMemo(() => [...new Set(items.map((i) => i.catalogue).filter(Boolean))], [items]);
  const rubriques = useMemo(() => [...new Set(items.filter((i) => !catalogue || i.catalogue === catalogue).map((i) => i.rubrique).filter(Boolean))], [items, catalogue]);
  const levels = useMemo(() => LEVELS.filter((l) => index.some((i) => i.levels.includes(l))), [index]);

  const terms = norm(q).split(/\s+/).filter(Boolean);
  const results = index.filter((i) => (!catalogue || i.catalogue === catalogue) && (!rubrique || i.rubrique === rubrique) && (!level || i.levels.includes(level)) && terms.every((t) => i.hay.includes(t)));

  // les références retirées du catalogue disparaissent de la demande
  const lines = Object.entries(request).filter(([code]) => byCode[code]).map(([code, qty]) => ({ item: byCode[code], qty }));
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.item.price, 0);

  const setQty = (code, qty) => {
    setNotice('');
    setRequest((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[code];
      else if (!(code in next) && Object.keys(next).length >= MAX_TITLES) { setNotice(`Une demande peut contenir ${MAX_TITLES} titres au maximum. Envoyez celle-ci, puis faites-en une seconde.`); return prev; }
      else next[code] = Math.min(qty, MAX_QTY);
      return next;
    });
  };

  const message = [
    'Bonjour, je souhaite commander les livres suivants (catalogue sur commande) :', '',
    ...lines.map((l) => `- ${l.qty} × ${l.item.title} (${l.item.code}) : ${fcfa(l.item.price)} l'unité`), '',
    `Total estimé : ${fcfa(total)}`, '', 'Merci de me confirmer la disponibilité et le délai de livraison.',
  ].join('\n');
  const link = `${whatsappUrl}${whatsappUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;

  const Qty = ({ item }) => {
    const qty = request[item.code] || 0;
    if (!qty) {
      return (
        <button type="button" onClick={() => setQty(item.code, 1)} className="inline-flex items-center gap-1.5 rounded-full border border-primary text-primary text-sm font-semibold px-4 py-2 hover:bg-primary/5 transition-colors" aria-label={`Ajouter ${item.title} à ma demande`}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground">
        <button type="button" onClick={() => setQty(item.code, qty - 1)} className="p-2.5" aria-label={`Retirer un exemplaire de ${item.title}`}><Minus className="w-4 h-4" /></button>
        <span className="min-w-[1.5rem] text-center text-sm font-semibold" aria-live="polite">{qty}</span>
        <button type="button" onClick={() => setQty(item.code, qty + 1)} className="p-2.5" aria-label={`Ajouter un exemplaire de ${item.title}`}><Plus className="w-4 h-4" /></button>
      </div>
    );
  };

  const select = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 pb-32">
      <p className="text-accent-text text-sm font-semibold tracking-widest uppercase mb-3">Sur commande</p>
      <h1 className="font-serif text-4xl md:text-5xl font-semibold text-primary mb-5">Le catalogue sur commande</h1>
      <p className="font-sans text-lg text-foreground/75 leading-relaxed max-w-2xl mb-10">
        Ces livres ne sont pas en stock : nous les commandons pour vous auprès de l'éditeur. Choisissez vos titres, envoyez votre demande sur WhatsApp, et notre équipe vous confirme la disponibilité et le délai de livraison.
      </p>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr] mb-6">
        <label className="relative block">
          <span className="sr-only">Rechercher un livre</span>
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/50" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Rechercher un titre, une collection, un code" className={`${select} pl-10`} />
        </label>
        <select aria-label="Catalogue" value={catalogue} onChange={(e) => { setCatalogue(e.target.value); setRubrique(''); setShown(PAGE); }} className={select}>
          <option value="">Tous les catalogues</option>
          {catalogues.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Rubrique" value={rubrique} onChange={(e) => { setRubrique(e.target.value); setShown(PAGE); }} className={select}>
          <option value="">Toutes les rubriques</option>
          {rubriques.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select aria-label="Niveau" value={level} onChange={(e) => { setLevel(e.target.value); setShown(PAGE); }} className={select}>
          <option value="">Tous les niveaux</option>
          {levels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-foreground/70 py-12 text-center">Chargement du catalogue…</p>
      ) : error ? (
        <p role="alert" className="text-destructive py-12 text-center">Le catalogue est momentanément indisponible. Réessayez dans un instant.</p>
      ) : items.length === 0 ? (
        <p className="text-foreground/70 py-12 text-center">Le catalogue sera bientôt disponible.</p>
      ) : (
        <>
          <p className="text-sm text-foreground/70 mb-3" aria-live="polite">{results.length} livre{results.length > 1 ? 's' : ''}</p>
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {results.slice(0, shown).map((i) => (
              <li key={i.code} className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-semibold text-primary leading-snug">{i.title}</p>
                  <p className="text-xs text-foreground/70 mt-1">{[i.rubrique, i.sous_rubrique || i.collection, i.level, i.audience].filter(Boolean).join(' · ')}</p>
                </div>
                <p className="text-sm font-semibold text-foreground whitespace-nowrap hidden sm:block">{fcfa(i.price)}</p>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-sm font-semibold text-foreground whitespace-nowrap sm:hidden">{fcfa(i.price)}</p>
                  <Qty item={i} />
                </div>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <div className="py-10">
              <p className="text-foreground/70 text-center mb-8">Aucun livre ne correspond à votre recherche.</p>
              <MissingBook initialTitle={q.trim()} whatsappUrl={whatsappUrl} />
            </div>
          )}
          {shown < results.length && (
            <div className="text-center mt-8">
              <button type="button" onClick={() => setShown(shown + PAGE)} className="rounded-full border border-primary text-primary text-sm font-semibold px-8 py-3 hover:bg-primary/5 transition-colors">Afficher plus de livres</button>
            </div>
          )}
        </>
      )}
      {notice && <p role="alert" className="text-sm text-destructive mt-6">{notice}</p>}

      {count > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 rounded-xl bg-primary text-primary-foreground shadow-xl px-5 py-3.5">
            <p className="text-sm"><span className="font-semibold">{count} livre{count > 1 ? 's' : ''}</span> · {fcfa(total)}</p>
            <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-secondary text-secondary-foreground text-sm font-semibold px-5 py-2 hover:opacity-90 transition-opacity">Voir ma demande</button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Ma demande de commande" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bg-white w-full sm:max-w-xl max-h-[88vh] overflow-auto rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="font-serif font-semibold text-2xl text-primary">Ma demande</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="p-1 text-foreground/60 hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            {lines.length === 0 ? <p className="text-foreground/70">Votre demande est vide.</p> : (
              <ul className="divide-y divide-border/60 mb-5">
                {lines.map(({ item, qty }) => (
                  <li key={item.code} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold leading-snug">{item.title}</p><p className="text-xs text-foreground/70">{qty} × {fcfa(item.price)}</p></div>
                    <Qty item={item} />
                    <button type="button" onClick={() => setQty(item.code, 0)} aria-label={`Supprimer ${item.title}`} className="p-1.5 text-foreground/60 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between border-t border-border/60 pt-4 mb-5">
              <span className="text-sm text-foreground/75">Total estimé</span><span className="font-semibold">{fcfa(total)}</span>
            </div>
            <a href={link} target="_blank" rel="noopener noreferrer" aria-disabled={lines.length === 0} className={`flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-6 py-3.5 hover:bg-primary/90 transition-colors ${lines.length === 0 ? 'pointer-events-none opacity-50' : ''}`}>
              <MessageCircle className="w-5 h-5" /> Envoyer ma demande sur WhatsApp
            </a>
            <p className="text-xs text-foreground/70 text-center mt-3">Aucun paiement maintenant : notre équipe vous répond pour confirmer la disponibilité et le délai.</p>
          </div>
        </div>
      )}
    </div>
  );
}
