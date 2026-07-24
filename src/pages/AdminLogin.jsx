import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminLogin, isAdminLoggedIn } from '@/lib/adminAuth';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAdminLoggedIn()) navigate('/admin');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(password);
      navigate('/admin');
    } catch (err) {
      setError('Mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-muted/30">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-border/50 shadow-sm p-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-primary text-center mb-6">
          Espace administrateur
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mot de passe</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-white rounded-full py-5 gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}
