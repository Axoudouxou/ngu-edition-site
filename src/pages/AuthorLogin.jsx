import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isAuthorLoggedIn, requestAuthorLogin } from '@/lib/authorAuth';

export default function AuthorLogin() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (isAuthorLoggedIn()) return <Navigate to="/auteur/tableau-de-bord" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Saisissez votre adresse email.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await requestAuthorLogin(email.trim());
      setSent(true);
    } catch (_) {
      setError("Impossible d'envoyer la demande pour le moment. Réessayez dans un instant.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20 md:py-28">
      <h1 className="font-serif text-3xl font-semibold text-primary mb-3">Espace auteur</h1>
      {sent ? (
        <p className="text-foreground/70 leading-relaxed">
          Si cette adresse correspond à un compte auteur, un lien de connexion vient de vous être
          envoyé. Pensez à regarder dans vos spams. Le lien reste valable 15 minutes.
        </p>
      ) : (
        <>
          <p className="text-foreground/70 leading-relaxed mb-8">
            Saisissez l'adresse email que NGU a enregistrée pour vous, nous vous envoyons un lien
            pour accéder à vos ventes.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="votre@email.com"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={sending} className="rounded-full gap-2 bg-accent hover:bg-accent/90 text-white">
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              Recevoir mon lien
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
