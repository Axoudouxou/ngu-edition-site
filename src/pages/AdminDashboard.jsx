import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, FileText, Package, LogOut, ShoppingBag } from 'lucide-react';
import { isAdminLoggedIn, clearAdminToken, adminFetchJson } from '@/lib/adminAuth';

const cards = [
  { to: '/admin/livres', label: 'Livres', icon: BookOpen, desc: 'Titres, prix, couvertures, fichiers ebook' },
  { to: '/admin/contenu', label: 'Contenu du site', icon: FileText, desc: 'Textes modifiables de chaque page' },
  { to: '/admin/stock', label: 'Stock', icon: Package, desc: 'Quantités disponibles' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/login');
      return;
    }
    adminFetchJson('/api/admin/orders').then(setOrders).catch(() => {});
  }, [navigate]);

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin/login');
  };

  const paidOrders = orders.filter(o => o.status === 'paid');

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-serif text-3xl font-semibold text-primary">Administration NGU</h1>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-muted/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Commandes payées</p>
          <p className="text-3xl font-bold text-primary">{paidOrders.length}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total commandes</p>
          <p className="text-3xl font-bold text-primary">{orders.length}</p>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {cards.map(({ to, label, icon: Icon, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-white border border-border/50 rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <p className="font-serif font-semibold text-primary mb-1">{label}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Commandes récentes
        </h2>
        <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Référence</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Livre</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Montant</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 15).map((o) => (
                <tr key={o.reference} className="border-t border-border/30">
                  <td className="px-4 py-3 font-mono text-xs">{o.reference}</td>
                  <td className="px-4 py-3">{o.book_id}</td>
                  <td className="px-4 py-3">{o.amount} FCFA</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      o.status === 'paid' ? 'bg-green-100 text-green-700' :
                      o.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Aucune commande pour l'instant</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
