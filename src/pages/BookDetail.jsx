import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBooks } from '@/hooks/useBooks';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Download, Truck, CheckCircle, Star, Loader2 } from 'lucide-react';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { initiateWavePayment } from '@/lib/wavePayment';
import { useToast } from '@/components/ui/use-toast';
import PhysicalCheckoutDrawer from '@/components/checkout/PhysicalCheckoutDrawer';



function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array(5).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />)}
    </div>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const { books } = useBooks(); const book = books.find(b => b.id === id);
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [physicalDrawerOpen, setPhysicalDrawerOpen] = useState(false);
  const { region, setManualOverride } = useGeoRegion();
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);

  const isAfrica = region === 'africa';

  if (!book) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <p className="text-foreground/60 mb-4">Livre introuvable.</p>
        <Link to="/boutique" className="text-accent hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  const formats = book.formats && book.formats.length
    ? book.formats
    : [
        ...(book.isEbook !== false ? [{ id: book.id + '-ebook', label: 'E-book PDF', price: book.ebookPriceFCFA, category: 'ebook', badge: 'Ebook', format: 'Ebook PDF', delivery: 'Téléchargement immédiat après paiement' }] : []),
        { id: book.id + '-physique', label: 'Livre physique', price: book.physiquePriceFCFA, category: 'physique', badge: 'Physique', format: 'Livre physique', delivery: 'Livraison en 7 à 15 jours ouvrés' },
      ];
  const format = formats[selectedFormat];
  const isEbook = format.category === 'ebook';
  const fcfaPrice = isEbook ? book.ebookPriceFCFA : book.physiquePriceFCFA;

  const displayPrice = isAfrica
    ? `${fcfaPrice.toLocaleString('fr-FR')} FCFA`
    : null;

  const handleWavePurchase = async () => {
    try {
      setPaying(true);
      await initiateWavePayment({
        amount: fcfaPrice,
        bookId: book.id,
        formatId: format.id,
        title: book.title,
      });
      // initiateWavePayment redirects to Wave; reaching here means redirect didn't happen
      setPaying(false);
    } catch (_) {
      setPaying(false);
      toast({
        title: 'Erreur',
        description: 'Impossible de lancer le paiement Wave. Réessayez.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
      <Link
        to="/boutique"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la boutique
      </Link>

      {/* Hero: cover + purchase panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mb-24">

        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="relative" style={{ perspective: 900 }}>
            <motion.img
              src={book.coverSrc}
              alt={book.title}
              whileHover={{ rotateY: 10, rotateX: -4, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              className="w-64 md:w-80 rounded-xl shadow-2xl object-cover"
              style={{ transformStyle: 'preserve-3d' }}
            />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/15 blur-xl rounded-full" />
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col justify-center space-y-6"
        >
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">{book.author}</p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary leading-tight">{book.title}</h1>
            <p className="mt-2 text-foreground/60 italic">{book.tagline}</p>
          </div>

          {/* Format selector */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Format</p>
            <div className="flex gap-3">
              {formats.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormat(i)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-all duration-200 ${
                    selectedFormat === i
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-white border-border text-foreground/70 hover:border-primary/50'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                    selectedFormat === i ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground'
                  }`} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          {displayPrice && (
            <motion.div
              key={format.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-4xl font-bold text-primary">{displayPrice}</p>
            </motion.div>
          )}

          {/* Delivery info */}
          <motion.div
            key={format.id + '-delivery'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 text-sm text-foreground/70 bg-muted/40 rounded-xl px-5 py-3.5"
          >
            {isEbook
              ? <Download className="w-4 h-4 text-accent flex-shrink-0" />
              : <Truck className="w-4 h-4 text-accent flex-shrink-0" />
            }
            {format.delivery}
          </motion.div>

          {/* CTA */}
          <div className="space-y-3">
            {/* Ebook Afrique → Paiement Wave */}
            {isEbook && isAfrica && (
              <button
                onClick={handleWavePurchase}
                disabled={paying}
                className="relative overflow-hidden inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold text-base px-10 py-4 rounded-full w-full md:w-auto disabled:opacity-60"
              >
                {paying
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirection vers Wave…</>
                  : <><Download className="w-5 h-5" /> Acheter</>}
              </button>
            )}

            {/* Ebook Monde → Amazon */}
            {isEbook && !isAfrica && (
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold text-base px-10 py-4 rounded-full w-full md:w-auto"
              >
                <span className="absolute inset-0 -skew-x-12 translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-700 bg-white/20 pointer-events-none" />
                <Download className="w-5 h-5" /> Acheter sur Amazon
              </a>
            )}

            {/* Physique Afrique → Drawer commande */}
            {isAfrica && !isEbook && (
              <button
                onClick={() => setPhysicalDrawerOpen(true)}
                className="relative overflow-hidden inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold text-base px-10 py-4 rounded-full w-full md:w-auto"
              >
                <span className="absolute inset-0 -skew-x-12 translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-700 bg-white/20 pointer-events-none" />
                <ShoppingBag className="w-5 h-5" /> Commander
              </button>
            )}

            {/* Physique Monde → Amazon */}
            {!isAfrica && !isEbook && (
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold text-base px-10 py-4 rounded-full w-full md:w-auto"
              >
                <span className="absolute inset-0 -skew-x-12 translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-700 bg-white/20 pointer-events-none" />
                <ShoppingBag className="w-5 h-5" /> Acheter sur Amazon
              </a>
            )}

            {/* Sélecteur manuel */}
            <p className="text-xs text-muted-foreground text-center md:text-left">
              {isAfrica ? (
                <button onClick={() => setManualOverride('world')} className="underline hover:text-primary transition-colors">
                  Vous êtes en Europe ou en Amérique ?
                </button>
              ) : (
                <button onClick={() => setManualOverride('africa')} className="underline hover:text-primary transition-colors">
                  Vous êtes en Afrique ?
                </button>
              )}
            </p>
          </div>
        </motion.div>
      </div>

      {/* About the book */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
        <div>
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">À propos</p>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary mb-5">Bien plus qu'un livre</h2>
          <div className="text-foreground/70 leading-relaxed space-y-4">
            {book.description.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">Points forts</p>
          {book.points.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-foreground/80">{point}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-muted/30 rounded-2xl px-8 py-12">
        <p className="text-accent text-sm font-semibold tracking-widest uppercase text-center mb-8">Ils l'ont lu</p>
        <h2 className="font-serif text-2xl font-semibold text-primary text-center mb-10">Ce qu'en disent les lecteurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {book.testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 border border-border/40 shadow-sm"
            >
              <Stars />
              <p className="mt-4 text-foreground/70 italic leading-relaxed">"{t.text}"</p>
              <p className="mt-3 text-sm font-semibold text-accent">— {t.author}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Physical Checkout Drawer (Afrique) */}
      <PhysicalCheckoutDrawer
        isOpen={physicalDrawerOpen}
        onClose={() => setPhysicalDrawerOpen(false)}
        book={book}
        format={format}
        priceFCFA={book.physiquePriceFCFA}
      />
    </div>
  );
}
