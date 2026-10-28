import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_BASE = 'https://payment.nguedition.com';
const MAX_BYTES = 15 * 1024 * 1024;

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`);

export default function SubmissionForm() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', consent: false, website: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [sentTo, setSentTo] = useState(null);

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: undefined })); };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setFile(null);
      setErrors((p) => ({ ...p, file: 'Le document doit être au format PDF.' }));
    } else if (f.size > MAX_BYTES) {
      setFile(null);
      setErrors((p) => ({ ...p, file: 'Le fichier est trop volumineux (15 Mo maximum).' }));
    } else {
      setFile(f);
      setErrors((p) => ({ ...p, file: undefined }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Requis';
    if (!form.last_name.trim()) e.last_name = 'Requis';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Adresse email invalide';
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) e.phone = 'Numéro de téléphone invalide';
    if (!file) e.file = errors.file || 'Merci de joindre votre document PDF.';
    if (!form.consent) e.consent = 'Merci de cocher cette case pour continuer.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setServerError('');
    if (Object.keys(e).length > 0) return;
    setSending(true);
    try {
      const body = new FormData();
      body.append('first_name', form.first_name.trim());
      body.append('last_name', form.last_name.trim());
      body.append('email', form.email.trim());
      body.append('phone', form.phone.trim());
      body.append('consent', '1');
      body.append('website', form.website);
      body.append('file', file);
      const res = await fetch(`${API_BASE}/api/submissions`, { method: 'POST', body });
      if (!res.ok) {
        let message = '';
        try { message = (await res.json()).error; } catch (_) { /* réponse non lisible */ }
        throw new Error(message || 'refusé');
      }
      setSentTo({ first_name: form.first_name.trim(), email: form.email.trim() });
    } catch (err) {
      const known = err instanceof Error && err.message && err.message !== 'refusé' && err.message !== 'Load failed' && err.message !== 'Failed to fetch';
      setServerError(known
        ? err.message
        : "L'envoi n'a pas abouti. Vérifiez votre connexion et la taille du fichier (15 Mo maximum), puis réessayez.");
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div role="status" className="text-center py-8">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-semibold text-primary mb-3">Merci {sentTo.first_name}, votre proposition est bien envoyée.</h2>
        <p className="text-foreground/70 leading-relaxed">
          Nous avons envoyé une confirmation à {sentTo.email}. Notre équipe étudie votre document et revient vers vous à cette adresse.
        </p>
      </div>
    );
  }

  const err = (k) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sub-first">Prénom</Label>
          <Input id="sub-first" autoComplete="given-name" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className={errors.first_name ? 'border-destructive' : ''} />
          {err('first_name')}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sub-last">Nom</Label>
          <Input id="sub-last" autoComplete="family-name" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className={errors.last_name ? 'border-destructive' : ''} />
          {err('last_name')}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sub-email">Adresse email</Label>
        <Input id="sub-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={errors.email ? 'border-destructive' : ''} />
        {err('email')}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sub-phone">Numéro de téléphone</Label>
        <Input id="sub-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+225 07 03 82 92 89" className={errors.phone ? 'border-destructive' : ''} />
        {err('phone')}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sub-file">Votre document (PDF)</Label>
        {file ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <span className="flex items-center gap-2 text-sm min-w-0"><FileText className="w-4 h-4 text-primary shrink-0" /><span className="truncate">{file.name}</span><span className="text-muted-foreground shrink-0">{formatSize(file.size)}</span></span>
            <button type="button" aria-label="Retirer le fichier" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <label htmlFor="sub-file" className={`flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors ${errors.file ? 'border-destructive text-destructive' : 'border-border text-muted-foreground'}`}>
            <FileText className="w-4 h-4" /> Choisir un fichier PDF (15 Mo maximum)
          </label>
        )}
        <input id="sub-file" type="file" accept=".pdf,application/pdf" className="sr-only" onChange={pickFile} />
        {err('file')}
      </div>

      {/* Champ piège : invisible pour les visiteurs, les robots le remplissent */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Ne pas remplir<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
      </div>

      <div className="space-y-1.5">
        <label className="flex items-start gap-3 text-sm text-foreground/70 leading-relaxed cursor-pointer">
          <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
          <span>
            J'accepte que NGU Édition utilise ces informations et ce document pour traiter ma proposition, comme décrit dans la{' '}
            <Link to="/confidentialite" className="underline underline-offset-2 hover:text-primary">politique de confidentialité</Link>.
          </span>
        </label>
        {err('consent')}
      </div>

      {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={sending} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 gap-2">
        {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</> : 'Envoyer ma proposition'}
      </Button>
    </form>
  );
}
