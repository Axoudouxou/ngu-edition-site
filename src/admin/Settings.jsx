import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { ErrorNote, Field, Page, Panel, Section, Spinner, btn, inputCls, useLoad } from './ui';
import { api } from './api';
import { clearAdminToken } from '@/lib/adminAuth';

export default function Settings() {
  const navigate = useNavigate();
  const state = useLoad(() => api('/api/admin/v2/settings'));
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (state.data) setF(state.data); }, [state.data]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api('/api/admin/v2/settings', { method: 'PUT', body: f });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Paramètres">
      {state.loading || !f ? <Spinner /> : (
        <div className="max-w-2xl">
          <Section title="Valeurs par défaut">
            <Panel className="p-5 space-y-4">
              <ErrorNote>{error || state.error}</ErrorNote>
              <Field label="Commission NGU proposée pour un nouvel auteur (%)" hint="Tu peux la modifier auteur par auteur.">
                <input type="number" className={inputCls} value={f.default_commission_percent} onChange={(e) => setF({ ...f, default_commission_percent: e.target.value })} />
              </Field>
              <Field label="Alerte de stock bas par défaut (exemplaires)" hint="Proposée pour un livre papier dont tu n'as pas encore réglé l'alerte.">
                <input type="number" className={inputCls} value={f.default_low_stock} onChange={(e) => setF({ ...f, default_low_stock: e.target.value })} />
              </Field>
              <div className="flex items-center gap-4">
                <button className={btn.primary} onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer</button>
                {saved && <span className="text-sm text-[#20392D] inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Enregistré</span>}
              </div>
            </Panel>
          </Section>

          <Section title="Règles automatiques">
            <Panel className="p-5 text-sm text-[#4B5A51] space-y-2.5 leading-relaxed">
              <p>Une commande non payée disparaît de l'administration au bout de 24 heures et des chiffres tout de suite.</p>
              <p>Elle est effacée définitivement après 30 jours. Ce délai évite de perdre une commande si un client paie très tard.</p>
              <p>Une commande remboursée sort du chiffre d'affaires, du solde de l'auteur et remet l'exemplaire en stock.</p>
            </Panel>
          </Section>

          <Section title="Coordonnées de la maison">
            <Panel className="p-5 text-sm text-[#4B5A51]">
              L'email, le téléphone et les réseaux sociaux affichés sur le site se règlent dans <Link to="/admin/contenu?section=coordonnees" className="text-[#8A5F1F] underline">Contenu du site</Link>.
            </Panel>
          </Section>

          <Section title="Session">
            <button className={btn.ghost} onClick={() => { clearAdminToken(); navigate('/admin/login'); }}>Se déconnecter</button>
          </Section>
        </div>
      )}
    </Page>
  );
}
