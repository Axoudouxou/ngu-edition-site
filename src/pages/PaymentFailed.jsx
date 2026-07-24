import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function PaymentFailed() {
  const navigate = useNavigate();

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
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-10 h-10 text-red-500" />
        </motion.div>

        <h1 className="font-serif text-3xl font-bold text-primary mb-3">Paiement échoué</h1>
        <p className="text-foreground/60 leading-relaxed mb-8">
          Votre paiement n'a pas pu être traité. Aucun montant n'a été débité de votre compte.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)}>
            <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-6 gap-2">
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
          </button>
          <Link to="/contact">
            <Button variant="outline" className="rounded-full px-6">
              Contacter le support
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Besoin d'aide ? WhatsApp : <a href="https://wa.me/2250703829289" className="text-accent underline">+225 07 03 82 92 89</a>
        </p>
      </motion.div>
    </div>
  );
}
