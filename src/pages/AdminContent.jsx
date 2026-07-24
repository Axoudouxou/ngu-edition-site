import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAdminLoggedIn, adminFetchJson } from '@/lib/adminAuth';

// Known editable keys used across the site, so admins see them even before any value is set.
const KNOWN_KEYS = [
  { key: 'home_hero_eyebrow', label: 'Accueil — petit texte au-dessus du titre', section: 'accueil' },
  { key: 'home_hero_title', label: 'Accueil — titre principal', section: 'accueil' },
  { key: 'home_hero_subtitle', label: 'Accueil — sous-titre', section: 'accueil' },
  { key: 'about_title', label: 'Notre histoire — titre', section: 'notre-histoire' },
  { key: 'about_tagline', label: 'Notre histoire — accroche', section: 'notre-histoire' },
  { key: 'about_founder_bio', label: 'Notre histoire — biographie du fondateur', section: 'notre-histoire' },
  { key: 'about_vision_text', label: 'Notre histoire — texte "Vision"', section: 'notre-histoire' },
  { key: 'about_mission_text', label: 'Notre histoire — texte "Mission"', section: 'notre-histoire' },
];

export default function AdminContent() {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(null);
  const [savedKey, setSavedKey] = useState('');
  const [customKey, setCustomKey] = useState('');

  const load = async () => {
    const rows = await adminFetchJson('/api/admin/content');
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });
    setValues(map);
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

      {/* Custom key */}
      <div className="mt-10 pt-8 border-t border-border/40">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Ajouter une clé personnalisée</h2>
        <div className="flex gap-3">
          <Input
            placeholder="ex: footer_message"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
          />
          <Button
            onClick={() => { if (customKey) { handleChange(customKey, ''); } }}
            variant="outline"
            className="gap-2 rounded-full"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
        {customKey && values[customKey] !== undefined && (
          <div className="bg-white border border-border/50 rounded-xl p-5 mt-4">
            <Label className="text-sm mb-2 block">{customKey}</Label>
            <Input
              value={values[customKey] || ''}
              onChange={(e) => handleChange(customKey, e.target.value)}
              className="mb-3"
            />
            <Button
              size="sm"
              onClick={() => handleSave(customKey)}
              className="bg-accent hover:bg-accent/90 text-white gap-2 rounded-full"
            >
              <Save className="w-3.5 h-3.5" /> Enregistrer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
