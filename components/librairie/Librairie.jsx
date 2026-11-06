import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { useSiteContent } from '@/hooks/useSiteContent';
import BookCover, { colorFor } from './BookCover';

const STORAGE_KEY = 'ngu_catalog_request';
const MAX_TITLES = 40;
const MAX_QTY = 20;
const FIELD = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const loadRequest = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (_) { return {}; } };
const saveRequest = (r) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch (_) { /* navigation privée */ } };
const linkFor = (base, text) => `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;

function Qty({ item, qty, onChange }) {
  if (!qty) {
    return (
      <button type="button" onClick={() => onChange(item.code, 1)} aria-label={`Ajouter ${item.title} à ma demande`}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:bg-primary/90 transition-colors">
        <Plus className="w-4 h-4" /> Ajouter à ma demande
      </button>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground">
      <button type="button" onClick={() => onChange(item.code, qty - 1)} className="p-2.5" aria-label={`Retirer un exemplaire de ${item.title}`}><Minus className="w-4 h-4" /></button>
      <span className="min-w-[1.5rem] text-center text-sm font-semibold" aria-live="polite">{qty}</span>
      <button type="button" onClick={() => onChange(item.code, qty + 1)} className="p-2.5" aria-label={`Ajouter un exemplaire de ${item.title}`}><Plus className="w-4 h-4" /></button>
    </div>
  );
}

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
  const ready = title.trim().length > 0;
  return (
    <section aria-labelledby="missing-title" className="max-w-xl mx-auto rounded-2xl border border-border/60 bg-white p-6">
      <h2 id="missing-title" className="font-serif text-xl font-semibold text-primary mb-2">Vous ne trouvez pas votre livre ?</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">Faites une demande : nous cherchons le livre pour vous et nous vous répondons sur WhatsApp avec le prix et le délai.</p>
      <div className="space-y-3 mb-5">
        <label className="block text-sm">Titre du livre<input value={title} onChange={(e) => setTitle(e.target.value)} className={`${FIELD} mt-1.5`} /></label>
        <label className="block text-sm">Auteur ou éditeur (facultatif)<input value={author} onChange={(e) => setAuthor(e.target.value)} className={`${FIELD} mt-1.5`} /></label>
        <label className="block text-sm">Précisions, par exemple la classe ou l'édition (facultatif)<textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} className={`${FIELD} mt-1.5`} /></label>
      </div>
      <a href={ready ? linkFor(whatsappUrl, message) : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!ready}
        className={`flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-6 py-3.5 hover:bg-primary/90 transition-colors ${ready ? '' : 'pointer-events-none opacity-50'}`}>
        <MessageCircle className="w-5 h-5" /> Envoyer ma demande sur WhatsApp
      </a>
      <p className="text-xs text-foreground/70 text-center mt-3">Aucun paiement maintenant.</p>
    </section>
  );
}

export default function Librairie() {
  const { items, loading, error } = useCatalog();
  const content = useSiteContent();
  const whatsappUrl = content.contact_whatsapp_url || 'https://wa.me/2250703829289';

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [openShelf, setOpenShelf] = useState(null);
  const [shownShelves, setShownShelves] = useState(8);
  const [selected, setSelected] = useState(null);
  const [request, setRequest] = useState(loadRequest);
  const [openRequest, setOpenRequest] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { saveRequest(request); }, [request]);

  const index = useMemo(() => items.map((i) => ({
    ...i,
    hay: norm(`${i.title} ${i.author} ${i.code} ${i.collection} ${i.rubrique} ${i.sous_rubrique} ${i.audience}`),
    shelfKey: [i.catalogue, i.rubrique, i.sous_rubrique || i.collection, i.level].join('|'),
  })), [items]);
  const byCode = useMemo(() => Object.fromEntries(index.map((i) => [i.code, i])), [index]);
  const categories = useMemo(() => [...new Set(items.map((i) => i.catalogue).filter(Boolean))], [items]);
  const shelves = useMemo(() => {
    const map = new Map();
    index.forEach((i) => {
      if (!map.has(i.shelfKey)) {
        const name = i.sous_rubrique || i.collection;
        map.set(i.shelfKey, {
          key: i.shelfKey, category: i.catalogue, items: [],
          title: name || i.rubrique,
          sub: [name ? i.rubrique : '', i.level, i.audience].filter(Boolean).join(' · ') || i.catalogue,
          tone: colorFor(name || i.rubrique),
        });
      }
      map.get(i.shelfKey).items.push(i);
    });
    return [...map.values()];
  }, [index]);

  const terms = norm(q).split(/\s+/).filter(Boolean);
  const inCategory = (i) => !category || i.catalogue === category;
  const results = terms.length ? index.filter((i) => inCategory(i) && terms.every((t) => i.hay.includes(t))) : [];
  const visibleShelves = shelves.filter((s) => !category || s.category === category);
  const shelf = openShelf ? shelves.find((s) => s.key === openShelf) : null;

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
    ...lines.map((l) => `- ${l.qty} × ${l.item.title}${l.item.author ? `, ${l.item.author}` : ''} (${l.item.code}) : ${fcfa(l.item.price)} l'unité`), '',
    `Total estimé : ${fcfa(total)}`, '', 'Merci de me confirmer la disponibilité et le délai de livraison.',
  ].join('\n');

  const Tile = ({ item, tone }) => (
    <button type="button" onClick={() => setSelected(item.code)} aria-label={`${item.title}${item.author ? `, ${item.author}` : ''}`}
      className="relative shrink-0 w-[96px] h-[140px] sm:w-[110px] sm:h-[160px] rounded-l-[3px] rounded-r-md shadow-[2px_4px_8px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A15A]">
      <span className="block w-full h-full overflow-hidden rounded-l-[3px] rounded-r-md"><BookCover item={item} tone={tone} /></span>
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-2 rounded-l-[3px] bg-gradient-to-r from-black/30 to-white/10" />
      {request[item.code] > 0 && <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-[#C9A15A] text-primary text-[11px] font-bold flex items-center justify-center">{request[item.code]}</span>}
    </button>
  );

  const chosen = selected ? byCode[selected] : null;

  return (
    <div className="max-w-5xl mx-auto pb-32">
      <label className="relative block mb-4">
        <span className="sr-only">Rechercher un livre</span>
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/50" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpenShelf(null); }} placeholder="Rechercher un titre, un auteur, une collection" className={`${FIELD} pl-10`} />
      </label>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {['', ...categories].map((c) => (
            <button key={c || 'all'} type="button" onClick={() => { setCategory(c); setOpenShelf(null); setShownShelves(8); }} aria-pressed={category === c}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground/75 hover:border-primary/50'}`}>{c || 'Tout'}</button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-foreground/70 py-12 text-center">Chargement de la librairie…</p>
      ) : error ? (
        <p role="alert" className="text-destructive py-12 text-center">La librairie est momentanément indisponible. Réessayez dans un instant.</p>
      ) : items.length === 0 ? (
        <p className="text-foreground/70 py-12 text-center">Les livres de la librairie arrivent bientôt.</p>
      ) : terms.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm text-foreground/70 mb-5" aria-live="polite">{results.length} livre{results.length > 1 ? 's' : ''}</p>
          {results.length === 0 ? (
            <div className="py-6"><p className="text-foreground/70 text-center mb-8">Aucun livre ne correspond à votre recherche.</p><MissingBook initialTitle={q.trim()} whatsappUrl={whatsappUrl} /></div>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-8 px-2">{results.slice(0, 120).map((i) => <Tile key={i.code} item={i} />)}</div>
          )}
        </div>
      ) : shelf ? (
        <div className="mt-6">
          <button type="button" onClick={() => setOpenShelf(null)} className="text-sm text-foreground/75 hover:text-primary underline underline-offset-4 mb-4">← Toutes les étagères</button>
          <h2 className="font-serif text-2xl font-semibold text-primary mb-1">{shelf.title}</h2>
          <p className="text-sm text-foreground/70 mb-6">{shelf.sub} · {shelf.items.length} livres</p>
          <div className="flex flex-wrap gap-x-5 gap-y-8 px-2">{shelf.items.map((i) => <Tile key={i.code} item={i} tone={shelf.tone} />)}</div>
        </div>
      ) : (
        <div>
          {visibleShelves.slice(0, shownShelves).map((s) => (
            <section key={s.key} className="mt-9" aria-label={s.title}>
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <h3 className="font-serif text-lg font-semibold text-primary">{s.title}<span className="ml-2 text-xs font-sans font-normal text-foreground/70">{s.sub}</span></h3>
                {s.items.length > 6 && <button type="button" onClick={() => setOpenShelf(s.key)} className="text-xs text-accent-text whitespace-nowrap hover:underline">Voir toute l'étagère →</button>}
              </div>
              <div className="flex gap-4 sm:gap-5 overflow-x-auto px-2 pt-4 pb-1 items-end [scrollbar-width:none]">
                {s.items.slice(0, 14).map((i) => <Tile key={i.code} item={i} tone={s.tone} />)}
              </div>
              <div className="h-3 rounded-b-lg shadow-[0_7px_11px_rgba(70,45,10,0.2)]" style={{ background: 'linear-gradient(#E4D6BF, #D1C0A2)' }} />
            </section>
          ))}
          {shownShelves < visibleShelves.length && (
            <div className="text-center mt-10">
              <button type="button" onClick={() => setShownShelves(shownShelves + 8)} className="rounded-full border border-primary text-primary text-sm font-semibold px-8 py-3 hover:bg-primary/5 transition-colors">Afficher plus d'étagères</button>
            </div>
          )}
        </div>
      )}
      {notice && <p role="alert" className="text-sm text-destructive mt-6">{notice}</p>}

      {chosen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label={chosen.title} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 relative">
            <button type="button" onClick={() => setSelected(null)} aria-label="Fermer" className="absolute top-4 right-4 p-1 text-foreground/60 hover:text-foreground"><X className="w-5 h-5" /></button>
            <div className="flex gap-5 mb-5">
              <div className="w-[104px] h-[150px] shrink-0 rounded-l-[3px] rounded-r-md overflow-hidden shadow-[2px_4px_8px_rgba(0,0,0,0.28)]"><BookCover item={chosen} tone={shelves.find((s) => s.key === chosen.shelfKey)?.tone} /></div>
              <div className="min-w-0 pr-6">
                <h2 className="font-serif text-xl font-semibold text-primary leading-snug">{chosen.title}</h2>
                {chosen.author && <p className="text-sm text-foreground/75 mt-1">{chosen.author}</p>}
                <p className="text-xs text-foreground/70 mt-2">{[chosen.rubrique, chosen.sous_rubrique || chosen.collection, chosen.level].filter(Boolean).join(' · ')}</p>
                <p className="font-serif font-semibold text-lg mt-3">{fcfa(chosen.price)}</p>
                <p className="text-xs text-foreground/70">Sur commande</p>
              </div>
            </div>
            <Qty item={chosen} qty={request[chosen.code] || 0} onChange={setQty} />
          </div>
        </div>
      )}

      {count > 0 && !openRequest && !chosen && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 rounded-xl bg-primary text-primary-foreground shadow-xl px-5 py-3.5">
            <p className="text-sm"><span className="font-semibold">{count} livre{count > 1 ? 's' : ''}</span> · {fcfa(total)}</p>
            <button type="button" onClick={() => setOpenRequest(true)} className="rounded-full bg-secondary text-secondary-foreground text-sm font-semibold px-5 py-2 hover:opacity-90 transition-opacity">Voir ma demande</button>
          </div>
        </div>
      )}

      {openRequest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Ma demande de commande" onClick={(e) => { if (e.target === e.currentTarget) setOpenRequest(false); }}>
          <div className="bg-white w-full sm:max-w-xl max-h-[88vh] overflow-auto rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="font-serif font-semibold text-2xl text-primary">Ma demande</h2>
              <button type="button" onClick={() => setOpenRequest(false)} aria-label="Fermer" className="p-1 text-foreground/60 hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            {lines.length === 0 ? <p className="text-foreground/70">Votre demande est vide.</p> : (
              <ul className="divide-y divide-border/60 mb-5">
                {lines.map(({ item, qty }) => (
                  <li key={item.code} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold leading-snug">{item.title}</p><p className="text-xs text-foreground/70">{item.author ? `${item.author} · ` : ''}{qty} × {fcfa(item.price)}</p></div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground">
                      <button type="button" onClick={() => setQty(item.code, qty - 1)} className="p-2" aria-label={`Retirer un exemplaire de ${item.title}`}><Minus className="w-4 h-4" /></button>
                      <span className="min-w-[1.25rem] text-center text-sm font-semibold">{qty}</span>
                      <button type="button" onClick={() => setQty(item.code, qty + 1)} className="p-2" aria-label={`Ajouter un exemplaire de ${item.title}`}><Plus className="w-4 h-4" /></button>
                    </div>
                    <button type="button" onClick={() => setQty(item.code, 0)} aria-label={`Supprimer ${item.title}`} className="p-1.5 text-foreground/60 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between border-t border-border/60 pt-4 mb-5"><span className="text-sm text-foreground/75">Total estimé</span><span className="font-semibold">{fcfa(total)}</span></div>
            <a href={linkFor(whatsappUrl, message)} target="_blank" rel="noopener noreferrer" aria-disabled={lines.length === 0}
              className={`flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-6 py-3.5 hover:bg-primary/90 transition-colors ${lines.length === 0 ? 'pointer-events-none opacity-50' : ''}`}>
              <MessageCircle className="w-5 h-5" /> Envoyer ma demande sur WhatsApp
            </a>
            <p className="text-xs text-foreground/70 text-center mt-3">Aucun paiement maintenant : notre équipe vous répond pour confirmer la disponibilité et le délai.</p>
          </div>
        </div>
      )}
    </div>
  );
}
