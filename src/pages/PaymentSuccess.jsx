import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Mail, Truck, Loader2, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { checkPayment, getOrderContext, clearOrderContext } from '@/lib/jekoPayment';
import { getEbookSignedLink } from '@/lib/ebookDelivery';

export default function PaymentSuccess() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'paid' | 'pending' | 'error'
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [reference, setReference] = useState(null);

  const verify = useCallback(async (ref) => {
    setStatus('checking');
    try {
      const data = await checkPayment(ref);
      if (data.status === 'paid') {
        setStatus('paid');
        setDownloadUrl(data.download_url || data.bookfunnel_url || data.ebook_url || null);
      } else {
        setStatus('pending');
      }
    } catch (_) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref =
      params.get('client_reference') ||
      params.get('reference') ||
      getOrderContext()?.reference;
    if (!ref) {
      setStatus('error');
      return;
    }
    setReference(ref);
    verify(ref);
  }, [verify]);

  const handleRetry = () => reference && verify(reference);

  // Once paid, build a time-limited (7-day) signed download link from the book's private file.
  useEffect(() => {
    if (status !== 'paid' || downloadUrl) return;
    const ctx = getOrderContext();
    if (!ctx?.bookId || !ctx?.reference) return;
    let active = true;
    getEbookSignedLink(ctx.bookId, ctx.reference)
      .then((url) => { if (active && url) setDownloadUrl(url); })
      .catch(() => {});
    return () => { active = false; };
  }, [status, downloadUrl]);

  const handleClose = () => {
    clearOrderContext();
  };

  /* ── Checking ── */
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-6" />
          <h1 className="font-serif text-2xl font-bold text-primary mb-2">
            Vérification du paiement…
          </h1>
          <p className="text-foreground/60">
            Nous confirmons votre paiement auprès de Wave, cela prend quelques secondes.
          </p>
        </div>
      </div>
    );
  }

  /* ── Pending (webhook not yet received) ── */
  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary mb-3">
            Paiement en cours de vérification
          </h1>
          <p className="text-foreground/60 leading-relaxed mb-8">
            Votre paiement a été initié. La confirmation peut mettre quelques instants
            à arriver. Réessayez dans un moment.
          </p>
          <Button
            onClick={handleRetry}
            className="bg-accent hover:bg-accent/90 text-white rounded-full px-6 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Relancer la vérification
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ── Error ── */
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary mb-3">
            Vérification impossible
          </h1>
          <p className="text-foreground/60 leading-relaxed mb-8">
            Nous n'avons pas pu vérifier votre paiement. Si vous avez bien payé,
            réessayez dans quelques instants.
          </p>
          <Button
            onClick={handleRetry}
            className="bg-accent hover:bg-accent/90 text-white rounded-full px-6 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Relancer la vérification
          </Button>
        </div>
      </div>
    );
  }

  /* ── Paid ── */
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>

        <h1 className="font-serif text-3xl font-bold text-primary mb-3">Paiement réussi !</h1>
        <p className="text-foreground/60 leading-relaxed mb-6">
          Merci pour votre achat. Votre commande a bien été confirmée.
        </p>

        {downloadUrl && (
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-block mb-8">
            <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-8 py-6 gap-2 text-base font-semibold">
              <Download className="w-5 h-5" />
              Télécharger mon ebook
            </Button>
          </a>
        )}

        <div className="space-y-3 mb-8 text-left">
          <div className="bg-muted/40 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Ebook commandé ?</p>
              <p className="text-sm text-muted-foreground">
                {downloadUrl
                  ? 'Votre lien de téléchargement est disponible ci-dessus. Un email de confirmation vous sera également envoyé.'
                  : "Vous recevrez votre ebook par email dans les minutes qui suivent. Vérifiez vos spams."}
              </p>
            </div>
          </div>

          <div className="bg-muted/40 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Livre physique commandé ?</p>
              <p className="text-sm text-muted-foreground">
                Notre équipe vous contacte sur WhatsApp sous <strong>24h</strong> pour organiser la livraison.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/boutique" onClick={handleClose}>
            <Button variant="outline" className="rounded-full px-6">
              Voir la boutique
            </Button>
          </Link>
          <Link to="/" onClick={handleClose}>
            <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-6">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
