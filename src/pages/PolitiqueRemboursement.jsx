import React from 'react';

export default function PolitiqueRemboursement() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <h1 className="font-serif text-4xl font-semibold text-primary mb-10">Politique de Remboursement</h1>
      <div className="space-y-6 text-foreground/70 leading-relaxed">

        <h2 className="font-serif text-xl font-semibold text-foreground">1. Ouvrages numériques (ebooks)</h2>
        <p>
          En raison de la nature immatérielle des produits numériques, aucun remboursement n'est possible dès lors
          que le fichier a été téléchargé ou envoyé au client, conformément aux usages en matière de contenus numériques.
        </p>
        <p>Une exception est faite en cas de :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>fichier corrompu ou illisible ;</li>
          <li>erreur technique empêchant l'accès au contenu acheté ;</li>
          <li>double facturation ou erreur de paiement avérée.</li>
        </ul>
        <p>
          Dans ces cas, le client dispose de <strong>7 jours</strong> après l'achat pour signaler le problème à
          edition@nguedition.com. Après vérification, un remboursement ou un nouvel envoi du fichier sera proposé.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">2. Ouvrages physiques (si applicable)</h2>
        <p>
          Pour les commandes de livres papier, le client dispose d'un délai de <strong>14 jours</strong> à compter
          de la réception pour demander un retour, à condition que l'ouvrage soit en parfait état (non lu, non endommagé).
        </p>
        <p>
          Les frais de retour restent à la charge du client, sauf en cas d'erreur de la part de NGU
          (mauvais article envoyé, produit défectueux).
        </p>
        <p>
          Le remboursement est effectué après réception et vérification du produit retourné, via le même moyen
          de paiement que celui utilisé lors de l'achat.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">3. Services d'accompagnement éditorial</h2>
        <p>
          Les prestations de service (accompagnement à l'auto-édition, etc.) font l'objet de conditions de
          remboursement spécifiques, précisées au moment de la souscription du service.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">4. Procédure de demande</h2>
        <p>Pour toute demande de remboursement, contacter :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Email : edition@nguedition.com</li>
          <li>Téléphone : +225 07 03 82 92 89</li>
        </ul>
        <p>en précisant le numéro de commande et le motif de la demande.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">5. Délai de traitement</h2>
        <p>
          Les demandes sont traitées sous <strong>72 heures ouvrées</strong>. Le remboursement effectif peut
          prendre entre 3 et 10 jours ouvrés selon le moyen de paiement utilisé.
        </p>

      </div>
    </div>
  );
}
