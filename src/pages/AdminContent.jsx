import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAdminLoggedIn, adminFetchJson } from '@/lib/adminAuth';

const KNOWN_KEYS = [
  { key: 'home_hero_eyebrow', label: 'Accueil — petit texte au-dessus du titre', section: 'Accueil' },
  { key: 'home_hero_title', label: 'Accueil — titre principal', section: 'Accueil' },
  { key: 'home_hero_subtitle', label: 'Accueil — sous-titre', section: 'Accueil' },
  { key: 'about_title', label: 'Notre histoire — titre', section: 'Notre histoire' },
  { key: 'about_tagline', label: 'Notre histoire — accroche', section: 'Notre histoire' },
  { key: 'about_founder_bio', label: 'Notre histoire — biographie du fondateur', section: 'Notre histoire' },
  { key: 'about_vision_text', label: 'Notre histoire — texte "Vision"', section: 'Notre histoire' },
  { key: 'about_mission_text', label: 'Notre histoire — texte "Mission"', section: 'Notre histoire' },
  { key: 'contact_email', label: 'Email de contact', section: 'Coordonnées' },
  { key: 'contact_phone_display', label: 'Téléphone affiché (ex: +225 07 03 82 92 89)', section: 'Coordonnées' },
  { key: 'contact_whatsapp_url', label: 'Lien WhatsApp (ex: https://wa.me/225...)', section: 'Coordonnées' },
  { key: 'instagram_url', label: 'Lien Instagram', section: 'Coordonnées' },
  { key: 'instagram_handle', label: 'Pseudo Instagram affiché (ex: @nevergiveupedt)', section: 'Coordonnées' },
  { key: 'facebook_url', label: 'Lien Facebook', section: 'Coordonnées' },
  { key: 'home_press_quote_text', label: 'Citation presse — texte', section: 'Presse' },
  { key: 'home_press_quote_author', label: 'Citation presse — auteur', section: 'Presse' },
];

const LIST_CONFIGS = [
  {
    key: 'home_testimonials',
    title: 'Témoignages (accueil)',
    fields: [{ name: 'text', label: 'Texte du témoignage', multiline: true }, { name: 'author', label: 'Auteur' }],
    emptyItem: { text: '', author: '' },
  },
  {
    key: 'home_faq',
    title: 'Questions fréquentes (FAQ)',
    fields: [{ name: 'question', label: 'Question' }, { name: 'answer', label: 'Réponse', multiline: true }],
    emptyItem: { question: '', answer: '' },
  },
  {
    key: 'home_press_links',
    title: 'Liens presse',
    fields: [{ name: 'name', label: 'Nom du média' }, { name: 'url', label: 'Lien de l\'article' }],
    emptyItem: { name: '', url: '' },
  },
  {
    key: 'home_librairies',
    title: 'Librairies partenaires',
    fields: [{ name: 'name', label: 'Nom de la librairie' }, { name: 'address', label: 'Adresse' }],
    emptyItem: { name: '', address: '' },
  },
];

function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export default function AdminContent() {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [lists, setLists] = useState({});
  const [saving, setSaving] = useState(null);
  const [savedKey, setSavedKey] = useState('');

  const load = async () => {
    const rows = await adminFetchJson('/api/admin/content');
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });
    setValues(map);
    const listMap = {};
    LIST_CONFIGS.forEach(cfg => { listMap[cfg.key] = parseList(map[cfg.key]); });
    setLists(listMap);
  };

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin/login'); return; }
    load();
  }, [navigate]);

  const handleChange = (key, value) => setValues(prev => ({ ...prev, [key]: value }));

  const handleSave = async (key, label = '', section = '') => {
    setSaving(key);
    try {
      await adminFetchJson('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify({ key, value: values[key] || '', label, section }),
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey(''), 2000);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveList = async (listKey) => {
    setSaving(listKey);
    try {
      await adminFetchJson('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify({ key: listKey, value: JSON.stringify(lists[listKey] || []), label: listKey, section: 'listes' }),
      });
      setSavedKey(listKey);
      setTimeout(() => setSavedKey(''), 2000);
    } finally {
      setSaving(null);
    }
  };

  const updateListItem = (listKey, index, field, value) => {
    setLists(prev => {
      const next = [...(prev[listKey] || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [listKey]: next };
    });
  };

  const addListItem = (listKey, emptyItem) => {
    setLists(prev => ({ ...prev, [listKey]: [...(prev[listKey] || []), { ...emptyItem }] }));
  };

  const removeListItem = (listKey, index) => {
    setLists(prev => ({ ...prev, [listKey]: prev[listKey].filter((_, i) => i !== index) }));
  };

  const sections = [...new Set(KNOWN_KEYS.map(k => k.section))];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>

      <h1 className="font-serif text-3xl font-semibold text-primary mb-8">Contenu du site</h1>

      {sections.map((section) => (
        <div key={section} className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{section}</h2>
          <div className="space-y-5">
            {KNOWN_KEYS.filter(k => k.section === section).map(({ key, label }) => (
              <div key={key} className="bg-white border border-border/50 rounded-xl p-5">
                <Label className="text-sm mb-2 block">{label}</Label>
                {key.includes('bio') || key.includes('text') ? (
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm mb-3"
                    value={values[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={values[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="mb-3"
                  />
                )}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => handleSave(key, label, section)}
                    disabled={saving === key}
                    className="bg-accent hover:bg-accent/90 text-white gap-2 rounded-full"
                  >
                    {saving === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Enregistrer
                  </Button>
                  {savedKey === key && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Enregistré</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {LIST_CONFIGS.map((cfg) => (
        <div key={cfg.key} className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{cfg.title}</h2>
          <div className="space-y-3 mb-3">
            {(lists[cfg.key] || []).map((item, i) => (
              <div key={i} className="bg-white border border-border/50 rounded-xl p-5 space-y-3">
                {cfg.fields.map((f) => (
                  f.multiline ? (
                    <div key={f.name}>
                      <Label className="text-xs text-muted-foreground mb-1 block">{f.label}</Label>
                      <textarea
                        className="w-full min-h-[70px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={item[f.name] || ''}
                        onChange={(e) => updateListItem(cfg.key, i, f.name, e.target.value)}
                      />
                    </div>
                  ) : (
                    <div key={f.name}>
                      <Label className="text-xs text-muted-foreground mb-1 block">{f.label}</Label>
                      <Input
                        value={item[f.name] || ''}
                        onChange={(e) => updateListItem(cfg.key, i, f.name, e.target.value)}
                      />
                    </div>
                  )
                ))}
                <button
                  type="button"
                  onClick={() => removeListItem(cfg.key, i)}
                  className="inline-flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer cette entrée
                </button>
              </div>
            ))}
            {(lists[cfg.key] || []).length === 0 && (
              <p className="text-sm text-muted-foreground italic">Aucune entrée — le site affiche les valeurs par défaut tant que rien n'est ajouté ici.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addListItem(cfg.key, cfg.emptyItem)}
              className="gap-2 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter une entrée
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveList(cfg.key)}
              disabled={saving === cfg.key}
              className="bg-accent hover:bg-accent/90 text-white gap-2 rounded-full"
            >
              {saving === cfg.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer la liste
            </Button>
            {savedKey === cfg.key && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Enregistré</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
