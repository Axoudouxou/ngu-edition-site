import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, BookOpen, FileText, LayoutDashboard, LogOut, Mail, Menu, Package, Settings, ShoppingBag, Users, X,
} from 'lucide-react';
import { clearAdminToken, isAdminLoggedIn } from '@/lib/adminAuth';

const NAV = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
  { to: '/admin/catalogue', label: 'Catalogue', icon: BookOpen },
  { to: '/admin/stock', label: 'Stock', icon: Package },
  { to: '/admin/auteurs', label: 'Auteurs et partenaires', icon: Users },
  { to: '/admin/contenu', label: 'Contenu du site', icon: FileText },
  { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { to: '/admin/rapports', label: 'Rapports', icon: BarChart3 },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

function Menu_({ onNavigate }) {
  const navigate = useNavigate();
  const logout = () => { clearAdminToken(); navigate('/admin/login'); };
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-7 pb-8">
        <p className="font-editorial text-2xl font-medium text-[#F7F6F2] leading-none">NGU Édition</p>
        <p className="text-[10px] tracking-[0.16em] text-[#C99A52] mt-2">ADMINISTRATION</p>
      </div>
      <nav className="flex-1 text-sm">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-2.5 border-l-2 transition-colors ${
                isActive
                  ? 'border-[#C99A52] bg-[#F7F6F2]/10 text-[#F7F6F2] font-medium'
                  : 'border-transparent text-[#BFCDC5] hover:text-[#F7F6F2] hover:bg-[#F7F6F2]/5'
              }`
            }
          >
            <Icon className="w-4 h-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-6 border-t border-[#F7F6F2]/10 space-y-3 text-sm">
        <a href="/" target="_blank" rel="noopener noreferrer" className="block text-[#BFCDC5] hover:text-[#F7F6F2]">Voir le site</a>
        <button onClick={logout} className="flex items-center gap-2 text-[#BFCDC5] hover:text-[#F7F6F2]">
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (!isAdminLoggedIn()) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#20392D] font-sans md:flex">
      <aside className="hidden md:block w-64 shrink-0 bg-[#20392D] sticky top-0 h-screen">
        <Menu_ />
      </aside>

      <div className="md:hidden sticky top-0 z-40 bg-[#20392D] flex items-center justify-between px-4 h-14">
        <p className="font-editorial text-xl text-[#F7F6F2]">NGU Édition</p>
        <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="text-[#F7F6F2]"><Menu className="w-6 h-6" /></button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className="w-72 max-w-[85%] bg-[#20392D] h-full relative">
            <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="absolute top-5 right-4 text-[#F7F6F2]"><X className="w-5 h-5" /></button>
            <Menu_ onNavigate={() => setOpen(false)} />
          </aside>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
