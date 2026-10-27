import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, Facebook } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';

const API_BASE = 'https://payment.nguedition.com';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Boutique', to: '/boutique' },
  { label: 'Notre histoire', to: '/notre-histoire' },
  { label: 'Notre engagement', to: '/notre-engagement' },
  { label: 'Publier avec NGU', to: '/publier' },
  { label: 'Questions fréquentes', to: '/faq' },
  { label: 'Contact', to: '/contact' },
];

const legalLinks = [
  { label: 'Mentions légales', to: '/mentions-legales' },
  { label: 'Confidentialité', to: '/confidentialite' },
  { label: 'CGV', to: '/cgv' },
  { label: 'CGU', to: '/cgu' },
  { label: 'Remboursement', to: '/politique-remboursement' },
  { label: 'Livraison', to: '/politique-livraison' },
  { label: 'Espace auteur', to: '/auteur' },
  { label: 'Admin', to: '/admin' },
];

const DEFAULT_LIBRAIRIES = [
  { name: 'Librairie Mont Carmel', address: 'Abidjan' },
  { name: 'FNAC Cap Nord', address: 'Cap Nord Mall, Abidjan' },
  { name: 'FNAC Cap Sud', address: 'Cap Sud Mall, Abidjan' },
];

function parseList(value, fallback) {
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) && list.length > 0 ? list : fallback;
  } catch (_) {
    return fallback;
  }
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setState('sending');
    try {
      const res = await fetch(`${API_BASE}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error('failed');
      setState('done');
      setEmail('');
    } catch (_) {
      setState('error');
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 max-w-sm">
      <label htmlFor="footer-newsletter" className="block text-sm text-primary-foreground/80 mb-3">
        Restez informés de nos nouvelles parutions.
      </label>
      <div className="flex">
        <input
          id="footer-newsletter"
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state !== 'sending') setState('idle'); }}
          placeholder="Votre adresse email"
          className="flex-1 min-w-0 bg-transparent border border-primary-foreground/30 rounded-l-sm px-4 py-2.5 text-sm placeholder:text-primary-foreground/40 focus:outline-none focus:border-primary-foreground/70"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="bg-primary-foreground text-primary text-sm font-medium px-5 rounded-r-sm hover:bg-primary-foreground/90 transition-colors disabled:opacity-60"
        >
          S’inscrire
        </button>
      </div>
      {state === 'done' && <p className="mt-3 text-sm text-secondary">Merci, vous êtes inscrit.</p>}
      {state === 'error' && <p className="mt-3 text-sm text-primary-foreground/80">L’inscription n’a pas abouti. Réessayez dans un instant.</p>}
    </form>
  );
}

export default function Footer() {
  const content = useSiteContent();
  const email = content.contact_email || 'edition@nguedition.com';
  const phoneDisplay = content.contact_phone_display || '+225 07 03 82 92 89';
  const whatsappUrl = content.contact_whatsapp_url || 'https://wa.me/2250703829289';
  const instagramUrl = content.instagram_url || 'https://www.instagram.com/nevergiveupedt';
  const facebookUrl = content.facebook_url || 'https://www.facebook.com/people/Never-Give-Up-Edition/61583814721195/?mibextid=wwXIfr';
  const librairies = parseList(content.home_librairies, DEFAULT_LIBRAIRIES);

  const socials = [
    { label: 'WhatsApp', href: whatsappUrl, icon: <WhatsAppIcon /> },
    { label: 'Instagram', href: instagramUrl, icon: <Instagram className="w-4 h-4" /> },
    { label: 'Facebook', href: facebookUrl, icon: <Facebook className="w-4 h-4" /> },
  ];

  const heading = 'text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/50 mb-5';
  const link = 'text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors';

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/logo.jpg" alt="Never Give Up Édition" className="h-10 w-10 rounded-sm object-cover" />
            <span className="font-serif text-lg">Never Give Up Édition</span>
          </Link>
          <p className="font-editorial italic text-2xl leading-snug text-primary-foreground/85 mt-6 max-w-xs">
            Les histoires méritent leur place.
          </p>
          <Newsletter />
        </div>

        <nav aria-label="Navigation du pied de page">
          <p className={heading}>Naviguer</p>
          <ul className="space-y-3">
            {navLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className={link}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <p className={heading}>Où trouver nos livres</p>
          <ul className="space-y-3">
            {librairies.map((l) => (
              <li key={l.name} className="text-sm text-primary-foreground/80">
                {l.name}
                {l.address && <span className="block text-primary-foreground/50">{l.address}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={heading}>Contact</p>
          <ul className="space-y-3">
            <li><a href={`mailto:${email}`} className={`${link} inline-flex items-center gap-2`}><Mail className="w-3.5 h-3.5" /> {email}</a></li>
            <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${link} inline-flex items-center gap-2`}><Phone className="w-3.5 h-3.5" /> {phoneDisplay}</a></li>
          </ul>
          <div className="flex items-center gap-2 mt-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-primary-foreground/30 flex items-center justify-center text-primary-foreground/80 hover:text-primary-foreground hover:border-primary-foreground/70 transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className="text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">{l.label}</Link></li>
            ))}
          </ul>
          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} Never Give Up Édition. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
