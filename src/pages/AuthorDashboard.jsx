import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';
import { isAuthorLoggedIn, clearAuthorToken, authorFetchJson } from '@/lib/authorAuth';

const money = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const day = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const monthLabel = (m) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

function Table({ head, rows, empty, right = [] }) {
  return (
    <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>{head.map((h, i) => <th key={h} className={`px-4 py-3 font-medium text-muted-foreground ${right.includes(i) ? 'text-right' : ''}`}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/30">
              {r.map((c, j) => <td key={j} className={`px-4 py-3 ${right.includes(j) ? 'text-right' : ''}`}>{c}</td>)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={head.length} className="px-4 py-6 text-center text-muted-foreground">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthorLoggedIn()) { navigate('/auteur'); return; }
    authorFetchJson('/api/author/dashboard').then(setData).catch(() => setError("Impossible de charger vos données pour le moment."));
  }, [navigate]);

  const logout = () => { clearAuthorToken(); navigate('/auteur'); };

  if (error) return <div className="max-w-md mx-auto px-6 py-24 text-center text-foreground/70">{error}</div>;
  if (!data) return <div className="py-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;

  const { totals, author } = data;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-primary">Votre espace auteur</h1>
          <p className="text-muted-foreground mt-1">{author.name}</p>
        </div>
        <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        {[
          ['Exemplaires vendus', totals.sold],
          ['Total gagné', money(totals.earned)],
          ['Déjà versé', money(totals.paid)],
          ['Reste à vous verser', money(totals.balance)],
        ].map(([label, value], i) => (
          <div key={label} className={`rounded-xl p-5 ${i === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted/40'}`}>
            <p className={`text-xs uppercase tracking-wide mb-1 ${i === 3 ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{label}</p>
            <p className={`text-xl font-bold ${i === 3 ? '' : 'text-primary'}`}>{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-10">
        Vous touchez {100 - author.commission_percent}% du prix payé par le lecteur, NGU garde {author.commission_percent}%.
        Les versements ont lieu une fois par mois.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="font-serif text-xl font-semibold text-primary mb-3">Vos livres</h2>
          <Table
            right={[1, 2, 3]}
            head={['Livre', 'Prix', 'Vendus', 'Gagné']}
            rows={data.books.map((b) => [b.title, b.price ? money(b.price) : '—', b.sold, money(b.earned)])}
            empty="Aucun livre rattaché à votre compte pour l'instant"
          />
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-primary mb-3">Ventes par mois</h2>
          <Table
            right={[1, 2]}
            head={['Mois', 'Vendus', 'Gagné']}
            rows={data.months.map((m) => [monthLabel(m.month), m.sold, money(m.earned)])}
            empty="Aucune vente pour l'instant"
          />
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-primary mb-3">Dernières ventes</h2>
          <Table
            right={[2, 3]}
            head={['Date', 'Livre', 'Prix payé', 'Votre part']}
            rows={data.sales.map((s) => [day(s.date), s.title, money(s.gross), money(s.earned)])}
            empty="Aucune vente pour l'instant"
          />
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-primary mb-3">Versements reçus</h2>
          <Table
            right={[2]}
            head={['Date', 'Note', 'Montant']}
            rows={data.payouts.map((p) => [day(p.date), p.note || '—', money(p.amount)])}
            empty="Aucun versement pour l'instant"
          />
        </section>
      </div>
    </div>
  );
}
