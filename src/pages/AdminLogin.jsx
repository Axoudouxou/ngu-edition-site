import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { adminLogin, isAdminLoggedIn } from '@/lib/adminAuth';
import { btn, inputCls } from '@/admin/ui';

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
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-6 font-sans">
      <div className="w-full max-w-sm">
        <p className="font-editorial text-4xl font-medium text-[#20392D] text-center">NGU Édition</p>
        <p className="text-[10px] tracking-[0.16em] text-[#8A5F1F] text-center mt-2 mb-10">ADMINISTRATION</p>
        <form onSubmit={handleSubmit} className="bg-white border border-[#E4E1D8] rounded-lg p-7 space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-[#4B5A51] mb-1.5">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </label>
          {error && <p className="text-sm text-[#A33B2F]">{error}</p>}
          <button type="submit" disabled={loading || !password} className={`${btn.primary} w-full`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
