import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function PhysicalCheckoutDrawer({ isOpen, onClose, book, format, priceFCFA }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '',
    phone_code: '+225', phone_number: '',
    address: '', district: '', city: '', country: 'Côte d\'Ivoire',
    cgv: false,
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('wave');

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Requis';
    if (!form.last_name.trim()) e.last_name = 'Requis';
    if (!form.phone_number.trim()) e.phone_number = 'Requis';
    if (!form.address.trim()) e.address = 'Requis';
    if (!form.city.trim()) e.city = 'Requis';
    if (!form.country.trim()) e.country = 'Requis';
    if (!form.cgv) e.cgv = 'Vous devez accepter les CGV';
    return e;
  };

  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setPaying(true);
    try {
      await initiateJekoPayment({
        amount: priceFCFA,
        bookId: book.id,
        formatId: format?.id,
        title: book.title,
        paymentMethod,
      });
    } catch (_) {
      setPaying(false);
      alert('Impossible de lancer le paiement. Réessayez.');
    }
  };

  const handleClose = () => {
    setForm({ first_name: '', last_name: '', phone_code: '+225', phone_number: '', address: '', district: '', city: '', country: 'Côte d\'Ivoire', cgv: false });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
              <h2 className="font-serif text-lg font-semibold text-primary">Commander le livre</h2>
              <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <>
                  {/* Product summary */}
                  <div className="flex gap-4 p-4 bg-muted/30 rounded-xl border border-border/50 mb-6">
                    <img src={book.coverSrc} alt={book.title} className="w-14 h-20 object-cover rounded-lg shadow-sm flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-serif font-semibold text-foreground leading-tight">{book.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format.label}</p>
                      <p className="mt-2 text-lg font-bold text-primary">{priceFCFA.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Prénom / Nom */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Prénom</Label>
                        <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jean" className={errors.first_name ? 'border-destructive' : ''} />
                        {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Nom</Label>
                        <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Dupont" className={errors.last_name ? 'border-destructive' : ''} />
                        {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Numéro WhatsApp</Label>
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
                      <p className="text-xs text-muted-foreground italic">Nous vous contacterons sur ce numéro pour la livraison.</p>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Adresse complète</Label>
                      <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rue, N°, Résidence..." className={errors.address ? 'border-destructive' : ''} />
                      {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                    </div>

                    {/* Quartier / Commune */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Quartier / Commune <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
                      <Input value={form.district} onChange={e => set('district', e.target.value)} placeholder="Cocody, Yopougon..." />
                    </div>

                    {/* Ville / Pays */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Ville</Label>
                        <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Abidjan" className={errors.city ? 'border-destructive' : ''} />
                        {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Pays</Label>
                        <Input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Côte d'Ivoire" className={errors.country ? 'border-destructive' : ''} />
                        {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                      </div>
                    </div>

                    {/* Moyen de paiement */}
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
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
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

                    {/* CGV */}
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
                        : <><Truck className="w-5 h-5" /> Payer {priceFCFA.toLocaleString('fr-FR')} FCFA</>}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                      🔒 Paiement sécurisé
                    </p>
                  </form>
              </>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
