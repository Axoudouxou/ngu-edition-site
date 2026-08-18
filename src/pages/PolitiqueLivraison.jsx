import React from 'react';

export default function PolitiqueLivraison() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <h1 className="font-serif text-4xl font-semibold text-primary mb-10">Politique de Livraison</h1>
      <div className="space-y-6 text-foreground/70 leading-relaxed">

        <h2 className="font-serif text-xl font-semibold text-foreground">1. Ouvrages numériques (ebooks)</h2>
        <p>
          Après validation du paiement (quel que soit le moyen utilisé : carte bancaire, Mobile Money MTN, Wave,
          Orange, Moov), l'ouvrage numérique est livré instantanément :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>par téléchargement direct depuis le site, et/ou</li>
          <li>par envoi automatique du lien de téléchargement à l'adresse email renseignée lors de la commande.</li>
        </ul>
        <p>Aucun délai d'expédition n'est applicable pour les produits numériques.</p>
        <p>En cas de non-réception du lien dans les 30 minutes suivant la confirmation du paiement, le client est invité à :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>vérifier ses courriers indésirables (spam) ;</li>
          <li>contacter edition@nguedition.com avec la référence de la commande et le moyen de paiement utilisé (ex. MTN Mobile Money).</li>
        </ul>

        <h2 className="font-serif text-xl font-semibold text-foreground">2. Ouvrages physiques (si applicable)</h2>
        <p>Pour les commandes de livres papier :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Délai de préparation : [X jours ouvrés]</li>
          <li>Délai de livraison : [X à X jours] selon la zone (Abidjan / autres villes de Côte d'Ivoire / international)</li>
          <li>Frais de livraison : calculés au moment de la commande</li>
          <li>Le client reçoit une confirmation par email et/ou SMS dès l'expédition.</li>
        </ul>

        <h2 className="font-serif text-xl font-semibold text-foreground">3. Paiement via Mobile Money (MTN, Wave, Orange, Moov)</h2>
        <p>
          Les commandes réglées par Mobile Money (MTN, Wave, Orange, Moov) sont traitées dès confirmation de la
          transaction par l'opérateur concerné. En cas de délai de confirmation du côté de l'opérateur (ex. réseau,
          validation), la livraison du produit numérique est déclenchée automatiquement dès réception de la
          confirmation, sans action supplémentaire requise de la part du client.
        </p>
        <p>
          En cas de débit sans réception du produit, le client est invité à contacter NGU sous 48h avec la capture
          d'écran ou la référence de la transaction Mobile Money, en précisant l'opérateur utilisé (MTN, Wave,
          Orange ou Moov).
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">4. Contact</h2>
        <p>Pour toute question relative à la livraison :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Email : edition@nguedition.com</li>
          <li>Téléphone : +225 07 03 82 92 89</li>
        </ul>

      </div>
    </div>
  );
}
