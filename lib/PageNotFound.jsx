import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 md:py-32 text-center">
      <p className="text-accent-text text-xs font-semibold tracking-widest uppercase mb-4">Erreur 404</p>
      <h1 className="font-serif text-4xl md:text-5xl font-semibold text-primary mb-5">Cette page n'existe pas.</h1>
      <p className="text-foreground/75 leading-relaxed mb-10">
        Le lien est peut-être incorrect, ou la page a été déplacée. Retrouvez nos livres ou revenez à l'accueil.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold px-8 py-3.5 hover:bg-primary/90 transition-colors">
          Retour à l'accueil
        </Link>
        <Link to="/boutique" className="inline-flex items-center justify-center rounded-full border border-primary text-primary text-sm font-semibold px-8 py-3.5 hover:bg-primary/5 transition-colors">
          Voir la boutique
        </Link>
      </div>
    </div>
  );
}
