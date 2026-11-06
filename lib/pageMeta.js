import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'https://nguedition.com';
const NAME = 'Never Give Up Édition';
const DEFAULT_TITLE = `${NAME} | Maison d'édition et librairie en ligne`;
const DEFAULT_DESC = "Never Give Up Édition, maison d'édition et librairie en ligne. Retrouvez nos livres et ceux d'auteurs et d'éditeurs partenaires, en ebook ou en papier.";

// Titre et description de chaque page ; noindex = page à ne pas montrer aux moteurs de recherche
const PAGES = {
  '/': {},
  '/boutique': { title: 'La librairie', description: "Tous les livres de la librairie NGU : publications de NGU Édition et ouvrages de maisons d'édition partenaires, en ebook ou en papier." },
  '/catalogue': { title: 'Catalogue sur commande', description: 'Livres de NEI-CEDA (littérature, manuels scolaires, dictionnaires) à commander auprès de la librairie NGU : choisissez vos titres et envoyez votre demande sur WhatsApp.' },
  '/notre-histoire': { title: 'Notre histoire', description: "L'histoire de Never Give Up Édition, maison d'édition née avec l'ambition de donner une voix aux histoires qui transforment et encouragent." },
  '/notre-engagement': { title: 'Notre engagement', description: 'Notre vision, notre mission et les moments forts de Never Give Up Édition : dédicaces et rencontres.' },
  '/contact': { title: 'Contact', description: 'Une question, un témoignage, une commande ? Écrivez à Never Give Up Édition.' },
  '/publier': { title: 'Publier avec NGU', description: "Auteurs et maisons d'édition : proposez votre livre à la librairie NGU et suivez vos ventes depuis votre espace auteur." },
  '/mentions-legales': { title: 'Mentions légales' },
  '/confidentialite': { title: 'Politique de confidentialité' },
  '/cgv': { title: 'Conditions générales de vente' },
  '/cgu': { title: "Conditions générales d'utilisation" },
  '/politique-remboursement': { title: 'Politique de remboursement' },
  '/politique-livraison': { title: 'Politique de livraison' },
  '/panier': { title: 'Panier', noindex: true },
  '/paiement-succes': { title: 'Paiement', noindex: true },
  '/paiement-echec': { title: 'Paiement', noindex: true },
};

function setTag(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyMeta({ title, description, noindex = false, image, path = '/' }) {
  const fullTitle = title ? `${title} | ${NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const url = `${SITE}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
  document.title = fullTitle;
  setTag('name', 'description', desc);
  setTag('property', 'og:title', fullTitle);
  setTag('property', 'og:description', desc);
  setTag('property', 'og:url', url);
  setTag('name', 'twitter:title', fullTitle);
  setTag('name', 'twitter:description', desc);
  if (image) {
    setTag('property', 'og:image', image);
    setTag('name', 'twitter:image', image);
  }
  setCanonical(url);
  const robots = document.head.querySelector('meta[name="robots"]');
  if (noindex) setTag('name', 'robots', 'noindex, nofollow');
  else if (robots) robots.remove();
}

/** Pose le titre et la description selon l'adresse de la page. À placer une fois dans le routeur. */
export function PageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const secret = pathname.startsWith('/admin') || pathname.startsWith('/auteur');
    const page = secret ? { title: pathname.startsWith('/admin') ? 'Administration' : 'Espace auteur', noindex: true } : PAGES[pathname] || (pathname.startsWith('/livre/') ? {} : { title: 'Page introuvable', noindex: true });
    applyMeta({ ...page, path: pathname });
  }, [pathname]);
  return null;
}

/** Pour une page dont le titre dépend de données (par exemple une fiche livre). */
export function usePageMeta({ title, description, image, noindex = false }) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!title) return;
    applyMeta({ title, description, image, noindex, path: pathname });
  }, [title, description, image, noindex, pathname]);
}
