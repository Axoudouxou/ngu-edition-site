import React from 'react';

export default function CGV() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <h1 className="font-serif text-4xl font-semibold text-primary mb-10">Conditions Générales de Vente</h1>
      <div className="space-y-6 text-foreground/70 leading-relaxed">
        <h2 className="font-serif text-xl font-semibold text-foreground">1. Objet</h2>
        <p>Les présentes CGV régissent la vente de livres physiques et d'ebooks sur le site Never Give Up Édition.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">2. Prix</h2>
        <p>Les prix sont indiqués en euros (€) pour l'Europe et en francs CFA (FCFA) pour l'Afrique. Ils sont fermes et définitifs au moment de la commande.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">3. Livraison</h2>
        <p>Les livres physiques sont expédiés dans un délai de 7 à 15 jours ouvrés selon la destination. Les ebooks sont envoyés immédiatement par email après paiement.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">4. Paiement</h2>
        <p>Le paiement s'effectue en ligne par carte bancaire ou mobile money selon votre région, via une plateforme sécurisée.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">5. Droit de rétractation</h2>
        <p>Les ebooks ne peuvent faire l'objet d'un droit de rétractation une fois téléchargés. Pour les livres physiques, vous disposez d'un délai de 14 jours pour exercer votre droit de rétractation.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">6. Contact</h2>
        <p>Pour toute question, contactez-nous à edition@nguedition.com ou au +225 07 03 82 92 89.</p>
      </div>
    </div>
  );
}
