import { useEffect } from 'react';
import ExternalGate from '@/components/ExternalGate';

function TallyFrame() {
  useEffect(() => {
    const w = 'https://tally.so/widgets/embed.js';
    const load = () => {
      if (typeof window.Tally !== 'undefined') {
        window.Tally.loadEmbeds();
      } else {
        document.querySelectorAll('iframe[data-tally-src]:not([src])').forEach((e) => {
          e.src = e.dataset.tallySrc;
        });
      }
    };

    if (typeof window.Tally !== 'undefined') {
      load();
    } else if (!document.querySelector(`script[src="${w}"]`)) {
      const s = document.createElement('script');
      s.src = w;
      s.onload = load;
      s.onerror = load;
      document.body.appendChild(s);
    } else {
      load();
    }
  }, []);

  return (
    <iframe
      data-tally-src="https://tally.so/embed/Pd2M0b?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&formEventsForwarding=1"
      loading="lazy"
      width="100%"
      height="540"
      frameBorder="0"
      marginHeight="0"
      marginWidth="0"
      title="Formulaire de contact"
    />
  );
}

export default function TallyEmbed() {
  return (
    <ExternalGate service="Tally" action="Afficher le formulaire" height={320}>
      <TallyFrame />
    </ExternalGate>
  );
}
