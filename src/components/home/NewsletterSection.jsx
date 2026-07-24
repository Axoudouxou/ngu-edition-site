import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_BASE = 'https://payment.nguedition.com';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      toast.success('Merci pour votre inscription !');
      setEmail('');
    } catch (_) {
      toast.error('Une erreur est survenue, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full border-t border-border/40 py-20">
      <div className="max-w-xl mx-auto px-6 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-4">
          Restez informés
        </h2>
        <p className="text-foreground/60 mb-8">
          Restez informés de nos nouvelles parutions.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1 border-border/50 bg-muted/30"
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-6"
          >
            {loading ? '...' : "S'inscrire"}
          </Button>
        </form>
      </div>
    </section>
  );
}
