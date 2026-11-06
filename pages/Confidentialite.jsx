import React from 'react';
import { Link } from 'react-router-dom';

const H2 = ({ children }) => <h2 className="font-serif text-xl font-semibold text-primary pt-4">{children}</h2>;

export default function Confidentialite() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <h1 className="font-serif text-4xl font-semibold text-primary mb-3">Politique de confidentialité</h1>
      <p className="text-sm text-foreground/70 mb-10">Dernière mise à jour : 5 novembre 2026</p>

      <div className="space-y-5 text-foreground/75 leading-relaxed">
        <H2>1. Qui est responsable de vos informations ?</H2>
        <p>
          NEVER GIVE UP EDITION SARL (« NGU Édition »), dont le siège est à Abidjan, Cocody Angré, Cité Arc en Ciel, Ilot N°9/820 (Côte d'Ivoire).
          Pour toute question : edition@nguedition.com ou +225 07 03 82 92 89.
        </p>

        <H2>2. Ce que nous recueillons, pourquoi, et pendant combien de temps</H2>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Commande d'un ebook :</strong> votre adresse email, le livre, le montant et le moyen de paiement choisi. Cela sert à vous envoyer le livre, confirmer la commande, répondre à vos questions et tenir notre comptabilité. Conservation : 10 ans, durée des obligations comptables.</li>
          <li><strong>Commande d'un livre papier :</strong> en plus, vos prénom, nom, numéro de téléphone et adresse de livraison (quartier, ville, pays), pour organiser la livraison et vous joindre. Conservation : 10 ans pour la commande ; nous ne réutilisons pas ces coordonnées pour autre chose.</li>
          <li><strong>Paiement :</strong> il se fait chez JEKO. Nous ne voyons ni ne gardons votre code secret ou vos identifiants Mobile Money ; nous gardons seulement la référence, le montant et le statut du paiement.</li>
          <li><strong>Demande depuis le catalogue sur commande :</strong> elle est envoyée par WhatsApp, et nous ne la recevons que dans cette messagerie. Le site ne la conserve pas, hormis la sélection mémorisée dans votre navigateur pour que vous la retrouviez.</li>
          <li><strong>Newsletter :</strong> votre adresse email, pour vous envoyer nos nouveautés, avec votre accord. Conservation : jusqu'à votre désinscription, que vous obtenez en nous écrivant.</li>
          <li><strong>Formulaire de contact :</strong> votre nom, votre email et votre message, pour vous répondre. Conservation : le temps de traiter votre demande, puis 3 ans au plus.</li>
          <li><strong>Proposition de manuscrit (Publier avec NGU) :</strong> vos prénom, nom, email, téléphone et le document PDF joint, pour étudier votre proposition et vous répondre. Le document n'est jamais public : seule l'équipe NGU y accède. Conservation : 2 ans après notre dernière réponse, sauf si nous publions votre livre (les règles du contrat s'appliquent alors).</li>
          <li><strong>Espace auteur :</strong> votre nom, votre email, vos ventes et vos versements, pour suivre vos ventes et vous payer. Conservation : durée du contrat, puis 10 ans pour la comptabilité.</li>
          <li><strong>Visite du site :</strong> aucun profilage publicitaire. Des journaux techniques (adresse IP, pages demandées) sont tenus par le serveur pour la sécurité du site, pendant une durée limitée.</li>
        </ul>

        <H2>3. Qui reçoit ces informations</H2>
        <p>Nous ne vendons pas vos informations. Nous utilisons des prestataires, qui n'y accèdent que pour nous rendre leur service :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>JEKO, pour le paiement par Mobile Money ;</li>
          <li>Resend, pour l'envoi des emails (confirmation de commande, lien de connexion auteur) ;</li>
          <li>DigitalOcean, qui héberge le site et ses données ;</li>
          <li>Tally, pour le formulaire de contact ;</li>
          <li>Google (carte Google Maps) et ipapi (détection du pays pour vous proposer le bon mode de livraison), uniquement si vous les acceptez ;</li>
          <li>WhatsApp, quand vous nous écrivez par ce moyen ;</li>
          <li>un outil de mesure d'audience sans cookies, lorsqu'il est activé : il compte les visites sans vous identifier.</li>
        </ul>
        <p>Certains de ces prestataires sont situés hors de Côte d'Ivoire, notamment en Europe ou aux États-Unis.</p>

        <H2>4. Cookies et stockage dans votre navigateur</H2>
        <p>
          Le site n'utilise aucun cookie publicitaire. Votre navigateur garde seulement ce qui est nécessaire au fonctionnement : votre sélection du catalogue sur commande,
          votre commande en cours, votre connexion à l'espace auteur et votre choix concernant les services extérieurs.
          La carte Google Maps, le formulaire Tally et la détection précise du pays ne se chargent qu'avec votre accord, que vous pouvez modifier à tout moment
          avec le lien « Gérer mes cookies » en bas de chaque page.
        </p>

        <H2>5. Sécurité</H2>
        <p>
          Le site est servi en HTTPS. L'administration est protégée par un mot de passe, et les manuscrits reçus sont rangés dans un espace non public.
          Aucune solution n'est infaillible : si une atteinte à vos informations nous concernait, nous vous en informerions.
        </p>

        <H2>6. Vos droits</H2>
        <p>
          Vous pouvez demander l'accès à vos informations, leur correction, leur suppression, vous opposer à leur usage ou en limiter l'usage, les récupérer, et retirer un consentement donné.
          Écrivez-nous à edition@nguedition.com : nous répondons dans un délai d'un mois. Pour supprimer votre adresse de la newsletter, un simple message suffit.
        </p>
        <p>
          Certaines informations de commande doivent être gardées pendant la durée légale, même si vous demandez leur suppression.
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'Autorité de régulation des télécommunications/TIC de Côte d'Ivoire (ARTCI) ou, si vous résidez dans l'Union européenne,
          l'autorité de protection des données de votre pays (en France, la CNIL). Cette politique s'appuie sur la loi ivoirienne n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel et, pour les résidents de l'Union européenne, sur le RGPD.
        </p>

        <H2>7. Modifications</H2>
        <p>Nous mettons cette page à jour quand nos pratiques changent. La date de dernière mise à jour figure en haut. Voir aussi nos <Link to="/mentions-legales" className="underline underline-offset-2 hover:text-primary">mentions légales</Link>.</p>
      </div>
    </div>
  );
}
