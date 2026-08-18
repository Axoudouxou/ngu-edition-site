import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { getBookByFormatId } from '@/lib/books';
import { initiateJekoPayment } from '@/lib/jekoPayment';

const COUNTRY_CODES = [
  { code: '+225', label: '🇨🇮 +225' },
  { code: '+221', label: '🇸🇳 +221' },
  { code: '+229', label: '🇧🇯 +229' },
  { code: '+223', label: '🇲🇱 +223' },
  { code: '+226', label: '🇧🇫 +226' },
  { code: '+237', label: '🇨🇲 +237' },
  { code: '+33',  label: '🇫🇷 +33'  },
  { code: '+32',  label: '🇧🇪 +32'  },
  { code: '+41',  label: '🇨🇭 +41'  },
  { code: '+1',   label: '🇺🇸 +1'   },
];

export default function Cart() {
  const { items, removeItem, updateQuantity } = useCart();
  const { region, loading: geoLoading } = useGeoRegion();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_code: '+225',
    phone_number: '',
    address: '',
    country: '',
    cgv: false,
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('wave');

  const hasEbooksOnly = items.every(i => i.category === 'ebook');
  const hasPhysical = items.some(i => i.category === 'physique');

  // Redirect if physical book outside Africa
  useEffect(() => {
    if (!geoLoading && hasPhysical && region !== 'africa' && items.length > 0) {
      const physicalItem = items.find(i => i.category === 'physique');
      if (physicalItem) {
        const book = getBookByFormatId(physicalItem.id);
        if (book?.amazonUrl) window.location.href = book.amazonUrl;
      }
    }
  }, [geoLoading, hasPhysical, region, items]);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Requis';
    if (!form.last_name.trim()) e.last_name = 'Requis';
    if (hasEbooksOnly && (!form.email.trim() || !form.email.includes('@'))) e.email = 'Email invalide';
    if (!form.phone_number.trim()) e.phone_number = 'Requis';
    if (hasPhysical && !form.address.trim()) e.address = 'Requis';
    if (hasPhysical && !form.country.trim()) e.country = 'Requis';
    if (!form.cgv) e.cgv = 'Vous devez accepter les CGV';
    return e;
  };

  const fcfaTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const [paying, setPaying] = useState(false);

  const handleCheckout = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setPaying(true);
    try {
      const firstItem = items[0];
      await initiateJekoPayment({
        amount: fcfaTotal,
        bookId: firstItem?.id?.replace(/-ebook$|-physique$/, '') || '',
        formatId: items.map(i => i.id).join(','),
        title: items.map(i => i.title).join(', '),
        customerEmail: form.email || '',
        paymentMethod,
      });
    } catch (_) {
      setPaying(false);
      alert('Impossible de lancer le paiement. Réessayez.');
    }
  };

  if (geoLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
        <h1 className="font-serif text-3xl font-semibold text-primary mb-4">Votre panier est vide</h1>
        <p className="text-foreground/60 mb-8">Découvrez nos livres et commencez votre collection.</p>
        <Link to="/boutique">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium gap-2 rounded-full px-8">
            <ArrowLeft className="w-4 h-4" />
            Voir la boutique
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
      <h1 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-10">Votre panier</h1>

      {/* Cart Items */}
      <div className="space-y-4 mb-10">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-semibold text-foreground truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.format}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-muted rounded">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-muted rounded">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="font-semibold text-primary w-24 text-right text-sm">
                {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
              </p>
              <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-destructive/10 rounded text-destructive/60 hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg mb-12">
        <span className="font-serif text-lg font-semibold text-primary">Total</span>
        <span className="text-2xl font-bold text-primary">
          {fcfaTotal.toLocaleString('fr-FR')} FCFA
        </span>
      </div>

      {/* Checkout Form */}
      <form onSubmit={handleCheckout} className="space-y-5">
        <h2 className="font-serif text-2xl font-semibold text-primary">
          {hasEbooksOnly ? 'Vos informations' : 'Informations de livraison'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Prénom</Label>
            <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jean" className={errors.first_name ? 'border-destructive' : ''} />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Dupont" className={errors.last_name ? 'border-destructive' : ''} />
            {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
          </div>
        </div>

        {hasEbooksOnly && (
          <div className="space-y-1.5">
            <Label>Adresse email</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@exemple.com" className={errors.email ? 'border-destructive' : ''} />
            {errors.email
              ? <p className="text-xs text-destructive">{errors.email}</p>
              : <p className="text-xs text-muted-foreground italic">Votre ebook sera envoyé à cette adresse.</p>
            }
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Numéro WhatsApp</Label>
          <div className="flex gap-2">
            <select
              value={form.phone_code}
              onChange={e => set('phone_code', e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <Input
              type="tel"
              value={form.phone_number}
              onChange={e => set('phone_number', e.target.value)}
              placeholder="07 03 82 92 89"
              className={`flex-1 ${errors.phone_number ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number}</p>}
        </div>

        {hasPhysical && (
          <>
            <div className="space-y-1.5">
              <Label>Adresse complète</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rue, N°, Résidence..." className={errors.address ? 'border-destructive' : ''} />
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Pays</Label>
              <Input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Côte d'Ivoire" className={errors.country ? 'border-destructive' : ''} />
              {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide">Moyen de paiement</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'wave', label: 'Wave' },
              { id: 'orange', label: 'Orange Money' },
              { id: 'mtn', label: 'MTN' },
              { id: 'moov', label: 'Moov' },
              { id: 'djamo', label: 'Djamo' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  paymentMethod === m.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white border-border text-foreground/70 hover:border-primary/50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.cgv}
              onChange={e => set('cgv', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
            />
            <span className="text-sm text-foreground/70 leading-relaxed">
              J'accepte les{' '}
              <a href="/cgv" target="_blank" className="text-accent underline underline-offset-2 hover:text-accent/80">
                Conditions Générales de Vente
              </a>
            </span>
          </label>
          {errors.cgv && <p className="text-xs text-destructive mt-1">{errors.cgv}</p>}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={paying}
          className="w-full bg-accent hover:bg-accent/90 text-white font-semibold rounded-full py-6 gap-2 mt-2 disabled:opacity-60"
        >
          {paying
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirection vers le paiement…</>
            : <><Download className="w-5 h-5" /> Payer {fcfaTotal.toLocaleString('fr-FR')} FCFA</>}
        </Button>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          🔒 Paiement sécurisé
        </p>
      </form>
    </div>
  );
}
