import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { ErrorNote, Field, Page, Panel, Spinner, btn, inputCls, useLoad } from './ui';
import { api, upload } from './api';

const FIELD = {
  home_hero_eyebrow: 'Petit texte au-dessus du titre',
  home_hero_title: 'Titre principal',
  home_hero_subtitle: 'Sous-titre',
  home_annonce_title: "Annonce « Nouveauté » : titre (laisse vide pour la masquer)",
  home_annonce_text: "Annonce « Nouveauté » : texte",
  about_title: 'Titre',
  about_tagline: 'Accroche',
  about_founder_bio: 'Biographie du fondateur',
  about_vision_text: 'Texte « Vision »',
  about_mission_text: 'Texte « Mission »',
  contact_email: 'Email de contact',
  contact_phone_display: 'Téléphone affiché (ex : +225 07 03 82 92 89)',
  contact_whatsapp_url: 'Lien WhatsApp (ex : https://wa.me/225…)',
  instagram_url: 'Lien Instagram',
  instagram_handle: 'Pseudo Instagram affiché (ex : @nevergiveupedt)',
  facebook_url: 'Lien Facebook',
  home_press_quote_text: 'Citation de presse : texte',
  home_press_quote_author: 'Citation de presse : auteur',
};

const LISTS = {
  home_testimonials: { title: 'Témoignages', fields: [{ name: 'text', label: 'Témoignage', multiline: true }, { name: 'author', label: 'Auteur' }], empty: { text: '', author: '' } },
  home_faq: { title: 'Questions et réponses', fields: [{ name: 'question', label: 'Question' }, { name: 'answer', label: 'Réponse', multiline: true }], empty: { question: '', answer: '' } },
  home_press_links: { title: 'Articles de presse', fields: [{ name: 'name', label: 'Média' }, { name: 'url', label: "Lien de l'article" }], empty: { name: '', url: '' } },
  home_librairies: { title: 'Librairies', fields: [{ name: 'name', label: 'Nom' }, { name: 'address', label: 'Adresse' }], empty: { name: '', address: '' } },
};

const GROUPS = [
  { id: 'accueil', label: 'Accueil', keys: ['home_hero_eyebrow', 'home_hero_title', 'home_hero_subtitle', 'home_annonce_title', 'home_annonce_text'], section: 'Accueil' },
  { id: 'histoire', label: 'Notre histoire', keys: ['about_title', 'about_tagline', 'about_founder_bio'], section: 'Notre histoire' },
  { id: 'engagement', label: 'Notre engagement', keys: ['about_vision_text', 'about_mission_text'], events: true, section: 'Notre engagement' },
  { id: 'coordonnees', label: 'Coordonnées', keys: ['contact_email', 'contact_phone_display', 'contact_whatsapp_url', 'instagram_url', 'instagram_handle', 'facebook_url'], section: 'Coordonnées' },
  { id: 'temoignages', label: 'Témoignages', lists: ['home_testimonials'] },
  { id: 'presse', label: 'Presse', keys: ['home_press_quote_text', 'home_press_quote_author'], lists: ['home_press_links'], section: 'Presse' },
  { id: 'faq', label: 'Questions fréquentes', lists: ['home_faq'] },
  { id: 'librairies', label: 'Librairies', lists: ['home_librairies'] },
];

const parseList = (v) => {
  try { const p = JSON.parse(v || '[]'); return Array.isArray(p) ? p : []; } catch (_) { return []; }
};

function ListEditor({ cfg, items, onChange }) {
  const setItem = (i, name, value) => onChange(items.map((it, j) => (j === i ? { ...it, [name]: value } : it)));
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F]">{cfg.title}</h3>
        <button className={btn.link} onClick={() => onChange([...items, { ...cfg.empty }])}><Plus className="w-3.5 h-3.5 inline -mt-0.5" /> Ajouter</button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-[#7B8478]">Aucun élément.</p>}
        {items.map((it, i) => (
          <Panel key={i} className="p-4 flex gap-3 items-start">
            <div className="flex-1 space-y-3">
              {cfg.fields.map((f) => (
                <Field key={f.name} label={f.label}>
                  {f.multiline
                    ? <textarea className={`${inputCls} min-h-[70px]`} value={it[f.name] || ''} onChange={(e) => setItem(i, f.name, e.target.value)} />
                    : <input className={inputCls} value={it[f.name] || ''} onChange={(e) => setItem(i, f.name, e.target.value)} />}
                </Field>
              ))}
            </div>
            <button aria-label="Retirer" className="text-[#A33B2F] mt-6" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function EventPhotos({ events, onChange, onUpload, uploading }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F]">Photos des événements</h3>
        <button className={btn.link} onClick={() => onChange([...events, { image_url: '', caption: '' }])}><Plus className="w-3.5 h-3.5 inline -mt-0.5" /> Ajouter une photo</button>
      </div>
      {events.length === 0 && <p className="text-sm text-[#7B8478]">Aucune photo.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {events.map((ev, i) => (
          <Panel key={i} className="p-3 space-y-2">
            <div className="aspect-square rounded bg-[#F1EFE8] overflow-hidden flex items-center justify-center">
              {ev.image_url ? <img src={ev.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-[#8A9188]">Aucune photo</span>}
            </div>
            <label className={`${btn.ghost} w-full cursor-pointer text-xs`}>
              {uploading === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ev.image_url ? 'Remplacer' : 'Choisir une photo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(i, e.target.files[0])} />
            </label>
            <input className={inputCls} value={ev.caption || ''} onChange={(e) => onChange(events.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} placeholder="Légende (ex : Dédicace, décembre 2026)" />
            <button className={btn.danger} onClick={() => onChange(events.filter((_, j) => j !== i))}>Retirer</button>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export default function Content() {
  const [params, setParams] = useSearchParams();
  const groupId = GROUPS.some((g) => g.id === params.get('section')) ? params.get('section') : 'accueil';
  const group = GROUPS.find((g) => g.id === groupId);

  const [values, setValues] = useState({});
  const [lists, setLists] = useState({});
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { setSaved(false); setError(''); }, [groupId]);

  const state = useLoad(async () => {
    const rows = await api('/api/admin/content');
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    setValues(map);
    setLists(Object.fromEntries(Object.keys(LISTS).map((k) => [k, parseList(map[k])])));
    setEvents(parseList(map.engagement_events));
    return true;
  });

  const post = (key, value, label = '', section = '') => api('/api/admin/content', { method: 'POST', body: { key, value, label, section } });

  const saveGroup = async () => {
    setSaving(true);
    setError('');
    try {
      for (const key of group.keys || []) await post(key, values[key] || '', FIELD[key], group.section);
      for (const key of group.lists || []) await post(key, JSON.stringify(lists[key] || []), key, 'listes');
      if (group.events) await post('engagement_events', JSON.stringify(events), 'Photos événements', 'listes');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (i, file) => {
    setUploading(i);
    setError('');
    try {
      const data = await upload('/api/admin/upload-event-photo', file);
      const next = events.map((x, j) => (j === i ? { ...x, image_url: data.url } : x));
      setEvents(next);
      await post('engagement_events', JSON.stringify(next), 'Photos événements', 'listes');
    } catch (e) {
      setError(`La photo n'a pas pu être envoyée. ${e.message}`);
    } finally {
      setUploading(null);
    }
  };

  return (
    <Page title="Contenu du site" subtitle="Les textes, les coordonnées et les listes affichés sur nguedition.com.">
      {state.loading ? <Spinner /> : (
        <div className="grid md:grid-cols-[210px_1fr] gap-8">
          <nav className="md:sticky md:top-8 self-start flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setParams({ section: g.id })}
                className={`text-left whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${g.id === groupId ? 'bg-[#20392D] text-[#F7F6F2] font-medium' : 'text-[#4B5A51] hover:bg-[#ECEAE3]'}`}
              >
                {g.label}
              </button>
            ))}
          </nav>

          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#20392D] mb-6">{group.label}</h2>
            <ErrorNote>{error || state.error}</ErrorNote>
            <div className="space-y-5 mb-8">
              {(group.keys || []).map((key) => (
                <Field key={key} label={FIELD[key]}>
                  {key.includes('bio') || key.includes('text')
                    ? <textarea className={`${inputCls} min-h-[100px]`} value={values[key] || ''} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                    : <input className={inputCls} value={values[key] || ''} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />}
                </Field>
              ))}
            </div>
            {(group.lists || []).map((k) => <ListEditor key={k} cfg={LISTS[k]} items={lists[k] || []} onChange={(items) => setLists({ ...lists, [k]: items })} />)}
            {group.events && <EventPhotos events={events} onChange={setEvents} onUpload={uploadPhoto} uploading={uploading} />}

            <div className="flex items-center gap-4 pt-5 border-t border-[#E4E1D8]">
              <button className={btn.primary} onClick={saveGroup} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer</button>
              {saved && <span className="text-sm text-[#20392D] inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Enregistré</span>}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
