import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { verifyAuthorToken } from '@/lib/authorAuth';

export default function AuthorVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get('token');
    if (!token) { setFailed(true); return; }
    verifyAuthorToken(token)
      .then(() => navigate('/auteur/tableau-de-bord', { replace: true }))
      .catch(() => setFailed(true));
  }, [params, navigate]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {failed ? (
        <>
          <h1 className="font-serif text-2xl font-semibold text-primary mb-3">Ce lien ne fonctionne plus</h1>
          <p className="text-foreground/70 leading-relaxed mb-6">
            Un lien ne sert qu'une fois et expire au bout de 15 minutes. Vous pouvez en demander un nouveau.
          </p>
          <Link to="/auteur" className="text-accent underline underline-offset-4">Demander un nouveau lien</Link>
        </>
      ) : (
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
      )}
    </div>
  );
}
