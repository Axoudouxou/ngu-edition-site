import React from 'react';

export default function CGU() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <h1 className="font-serif text-4xl font-semibold text-primary mb-10">Conditions Générales d'Utilisation (CGU)</h1>
      <div className="space-y-6 text-foreground/70 leading-relaxed">

        <h2 className="font-serif text-xl font-semibold text-foreground">1. Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) définissent les règles d'accès et d'utilisation
          du site nguedition.com, édité par NEVER GIVE UP EDITION SARL, société immatriculée au RCCM sous le
          numéro CI-ABJ-03-2026-B13-05756, dont le siège social est situé à Abidjan, Cocody Angré, Cité Arc en Ciel,
          Îlot N°9/820, Côte d'Ivoire.
        </p>
        <p>L'utilisation du site implique l'acceptation pleine et entière des présentes CGU.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">2. Accès au site</h2>
        <p>
          Le site est accessible gratuitement à tout utilisateur disposant d'un accès à internet. Tous les frais
          liés à cet accès (matériel, connexion internet, etc.) sont à la charge de l'utilisateur.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">3. Services proposés</h2>
        <p>nguedition.com propose :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>la présentation et la vente d'ouvrages (formats numériques et/ou papier selon disponibilité) ;</li>
          <li>un service d'accompagnement à l'auto-édition guidée ;</li>
          <li>des contenus éditoriaux liés aux publications de NGU.</li>
        </ul>

        <h2 className="font-serif text-xl font-semibold text-foreground">4. Compte utilisateur</h2>
        <p>
          Certaines fonctionnalités peuvent nécessiter la création d'un compte. L'utilisateur s'engage à fournir
          des informations exactes et à jour, et à préserver la confidentialité de ses identifiants de connexion.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">5. Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur le site (textes, visuels, logos, ouvrages) est protégé par le droit
          de la propriété intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est interdite.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">6. Achats et paiements</h2>
        <p>
          Les commandes passées sur le site sont soumises aux Conditions Générales de Vente (CGV), consultables
          sur <a href="/cgv" className="text-accent underline underline-offset-2 hover:text-accent/80">nguedition.com/cgv</a>.
          Les paiements sont traités par des prestataires de paiement tiers sécurisés.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">7. Responsabilité</h2>
        <p>
          NGU s'efforce d'assurer l'exactitude des informations diffusées sur le site, sans garantie d'exhaustivité.
          NGU ne saurait être tenue responsable des interruptions de service, dysfonctionnements techniques ou
          dommages indirects résultant de l'utilisation du site.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">8. Données personnelles</h2>
        <p>
          Les données collectées via le site sont traitées conformément à la réglementation applicable en
          Côte d'Ivoire en matière de protection des données personnelles. Pour plus d'informations, voir la{' '}
          <a href="/confidentialite" className="text-accent underline underline-offset-2 hover:text-accent/80">Politique de Confidentialité</a>.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">9. Modification des CGU</h2>
        <p>NGU se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont invités à les consulter régulièrement.</p>

        <h2 className="font-serif text-xl font-semibold text-foreground">10. Droit applicable et litiges</h2>
        <p>
          Les présentes CGU sont soumises au droit ivoirien. En cas de litige, une solution amiable sera recherchée
          avant toute action judiciaire ; à défaut, les tribunaux d'Abidjan seront seuls compétents.
        </p>

        <h2 className="font-serif text-xl font-semibold text-foreground">11. Contact</h2>
        <p>Pour toute question relative aux présentes CGU : edition@nguedition.com</p>

      </div>
    </div>
  );
}
