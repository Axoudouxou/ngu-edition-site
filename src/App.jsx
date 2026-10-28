import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { CartProvider } from '@/lib/CartContext';

import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import Boutique from '@/pages/Boutique';
import BookDetail from '@/pages/BookDetail';

import Cart from '@/pages/Cart';
import NotreHistoire from '@/pages/NotreHistoire';
import NotreEngagement from '@/pages/NotreEngagement';
import Contact from '@/pages/Contact';
import PublierAvecNGU from '@/pages/PublierAvecNGU';
import MentionsLegales from '@/pages/MentionsLegales';
import Confidentialite from '@/pages/Confidentialite';
import CGV from '@/pages/CGV';
import CGU from '@/pages/CGU';
import PolitiqueRemboursement from '@/pages/PolitiqueRemboursement';
import PolitiqueLivraison from '@/pages/PolitiqueLivraison';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentFailed from '@/pages/PaymentFailed';
import AdminLogin from '@/pages/AdminLogin';
import AdminLayout from '@/admin/AdminLayout';
import AdminDashboard from '@/admin/Dashboard';
import AdminOrders from '@/admin/Orders';
import AdminCatalogue from '@/admin/Catalogue';
import AdminStock from '@/admin/Stock';
import AdminPeople from '@/admin/People';
import AdminContent from '@/admin/Content';
import AdminReports from '@/admin/Reports';
import AdminNewsletter from '@/admin/Newsletter';
import AdminSettings from '@/admin/Settings';
import AuthorLogin from '@/pages/AuthorLogin';
import AuthorVerify from '@/pages/AuthorVerify';
import AuthorDashboard from '@/pages/AuthorDashboard';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <CartProvider>
        <Router>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/livre/:id" element={<BookDetail />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/notre-histoire" element={<NotreHistoire />} />
              <Route path="/notre-engagement" element={<NotreEngagement />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/publier" element={<PublierAvecNGU />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/politique-remboursement" element={<PolitiqueRemboursement />} />
              <Route path="/politique-livraison" element={<PolitiqueLivraison />} />
              <Route path="/paiement-succes" element={<PaymentSuccess />} />
              <Route path="/paiement-echec" element={<PaymentFailed />} />
              <Route path="/auteur" element={<AuthorLogin />} />
              <Route path="/auteur/connexion" element={<AuthorVerify />} />
              <Route path="/auteur/tableau-de-bord" element={<AuthorDashboard />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="commandes" element={<AdminOrders />} />
              <Route path="catalogue" element={<AdminCatalogue />} />
              <Route path="stock" element={<AdminStock />} />
              <Route path="auteurs" element={<AdminPeople />} />
              <Route path="contenu" element={<AdminContent />} />
              <Route path="newsletter" element={<AdminNewsletter />} />
              <Route path="rapports" element={<AdminReports />} />
              <Route path="parametres" element={<AdminSettings />} />
              <Route path="livres" element={<Navigate to="/admin/catalogue" replace />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  )
}

export default App
