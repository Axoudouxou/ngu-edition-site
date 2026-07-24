import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { CartProvider } from '@/lib/CartContext';

import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import Boutique from '@/pages/Boutique';
import BookDetail from '@/pages/BookDetail';

import Cart from '@/pages/Cart';
import NotreHistoire from '@/pages/NotreHistoire';
import Contact from '@/pages/Contact';
import MentionsLegales from '@/pages/MentionsLegales';
import Confidentialite from '@/pages/Confidentialite';
import CGV from '@/pages/CGV';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentFailed from '@/pages/PaymentFailed';
import AdminStock from '@/pages/AdminStock';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminBooks from '@/pages/AdminBooks';
import AdminContent from '@/pages/AdminContent';

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
              <Route path="/contact" element={<Contact />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/paiement-succes" element={<PaymentSuccess />} />
              <Route path="/paiement-echec" element={<PaymentFailed />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/livres" element={<AdminBooks />} />
              <Route path="/admin/contenu" element={<AdminContent />} />
              <Route path="/admin/stock" element={<AdminStock />} />
              <Route path="/admin/login" element={<AdminLogin />} />
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
