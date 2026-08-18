import React, { useEffect, useState, useRef } from 'react';

const SEEN_KEY = 'ngu_doors_intro_seen';

// Timing (ms) — slow, cinematic
const T = {
  start: 300,       // brief hold on closed doors before opening
  doorsDuration: 2600,
  glowDelay: 900,    // glow starts partway through the door opening
  glowDuration: 2400,
  booksDelay: 2700,  // books begin once doors are essentially open
  booksDuration: 1600,
  brandDelay: 4100,
  brandDuration: 1400,
  holdAfter: 900,    // pause once everything is revealed
  fadeOutDuration: 1100,
};
const TOTAL = T.brandDelay + T.brandDuration + T.holdAfter + T.fadeOutDuration;

export default function HeroDoorsIntro({ coverSrc1, coverSrc2 }) {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState('closed'); // closed → opening → revealed → fading
  const timers = useRef([]);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch (_) { /* ignore */ }

    if (alreadySeen) {
      setVisible(false);
      return;
    }

    setVisible(true);
    // Respect reduced-motion preference: skip straight to revealed, then fade quickly.
    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setStage('revealed');
      timers.current.push(setTimeout(() => setStage('fading'), 400));
      timers.current.push(setTimeout(() => finish(), 1000));
      return () => timers.current.forEach(clearTimeout);
    }

    timers.current.push(setTimeout(() => setStage('opening'), T.start));
    timers.current.push(setTimeout(() => setStage('revealed'), T.brandDelay));
    timers.current.push(setTimeout(() => setStage('fading'), TOTAL - T.fadeOutDuration));
    timers.current.push(setTimeout(() => finish(), TOTAL));

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch (_) { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  const doorsOpen = stage === 'opening' || stage === 'revealed' || stage === 'fading';
  const glowOn = stage === 'opening' || stage === 'revealed' || stage === 'fading';
  const booksOn = stage === 'revealed' || stage === 'fading';
  const brandOn = stage === 'revealed' || stage === 'fading';
  const fadingOut = stage === 'fading';

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-50 overflow-hidden"
      style={{
        opacity: fadingOut ? 0 : 1,
        transition: `opacity ${T.fadeOutDuration}ms ease`,
        pointerEvents: fadingOut ? 'none' : 'auto',
        background: '#0A0D06',
      }}
    >
      {/* Warm glow behind the doors */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 55%, #C9A15A 0%, #6B4E1E 32%, #0A0D06 72%)',
          opacity: glowOn ? 1 : 0,
          transition: `opacity ${T.glowDuration}ms ease`,
        }}
      />

      {/* Books */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(20px, 6vw, 56px)',
          opacity: booksOn ? 1 : 0,
          transform: booksOn ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.92)',
          transition: `opacity ${T.booksDuration}ms ease, transform ${T.booksDuration}ms ease`,
          perspective: 1400,
        }}
      >
        <div
          className="ngu-door-book"
          style={{
            width: 'clamp(110px, 22vw, 190px)',
            aspectRatio: '2/3',
            borderRadius: '2px 8px 8px 2px',
            overflow: 'hidden',
            boxShadow: '16px 22px 48px rgba(0,0,0,0.55), -4px 0 0 rgba(0,0,0,0.35)',
            transform: 'rotateY(9deg)',
            animation: booksOn ? 'nguFloat1 5.5s ease-in-out infinite' : 'none',
          }}
        >
          <img src={coverSrc1} alt="" className="w-full h-full object-cover" />
        </div>
        <div
          className="ngu-door-book"
          style={{
            width: 'clamp(110px, 22vw, 190px)',
            aspectRatio: '2/3',
            borderRadius: '2px 8px 8px 2px',
            overflow: 'hidden',
            boxShadow: '16px 22px 48px rgba(0,0,0,0.55), -4px 0 0 rgba(0,0,0,0.35)',
            transform: 'rotateY(-9deg)',
            animation: booksOn ? 'nguFloat2 6s ease-in-out infinite' : 'none',
          }}
        >
          <img src={coverSrc2} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Doors */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
          background: '#2A3B19',
          transformOrigin: 'left center',
          transform: doorsOpen ? 'rotateY(-108deg)' : 'rotateY(0deg)',
          transition: `transform ${T.doorsDuration}ms cubic-bezier(0.7,0,0.3,1)`,
          borderRight: '1px solid rgba(201,161,90,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: 14,
        }}
      >
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C9A15A', opacity: 0.75 }} />
      </div>
      <div
        style={{
          position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
          background: '#2A3B19',
          transformOrigin: 'right center',
          transform: doorsOpen ? 'rotateY(108deg)' : 'rotateY(0deg)',
          transition: `transform ${T.doorsDuration}ms cubic-bezier(0.7,0,0.3,1)`,
          borderLeft: '1px solid rgba(201,161,90,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          paddingLeft: 14,
        }}
      >
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C9A15A', opacity: 0.75 }} />
      </div>

      {/* Brand */}
      <div
        style={{
          position: 'absolute', bottom: '8%', left: 0, right: 0, textAlign: 'center',
          opacity: brandOn ? 1 : 0,
          transition: `opacity ${T.brandDuration}ms ease`,
        }}
      >
        <p className="font-serif" style={{ fontWeight: 700, letterSpacing: '0.25em', color: '#E6E2DA', fontSize: 'clamp(14px, 3vw, 20px)', margin: 0, textTransform: 'uppercase' }}>
          Never Give Up Édition
        </p>
        <p className="font-editorial italic" style={{ color: '#C9A15A', fontSize: 'clamp(12px, 2.2vw, 15px)', marginTop: 8 }}>
          Ouvrez la porte. Entrez dans nos histoires.
        </p>
      </div>

      <style>{`
        @keyframes nguFloat1 { 0%,100%{transform:rotateY(9deg) translateY(0);} 50%{transform:rotateY(9deg) translateY(-8px);} }
        @keyframes nguFloat2 { 0%,100%{transform:rotateY(-9deg) translateY(0);} 50%{transform:rotateY(-9deg) translateY(-6px);} }
      `}</style>
    </div>
  );
}
