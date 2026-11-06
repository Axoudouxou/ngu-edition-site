import { useSyncExternalStore } from 'react';

// Choix du visiteur pour les services extérieurs (carte Google Maps, formulaire Tally, détection précise du pays).
const KEY = 'ngu_consent_v1';
const listeners = new Set();
let memoryChoice = null;      // si le navigateur refuse d'écrire (navigation privée)
let bannerForced = false;     // « Gérer mes cookies » rouvre la bannière

const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  window.addEventListener('storage', emit);
  return () => { listeners.delete(l); window.removeEventListener('storage', emit); };
};

function readChoice() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v.external === 'boolean') return v.external;
  } catch (_) { /* illisible : pas de choix */ }
  return memoryChoice;
}

export function setConsent(external) {
  memoryChoice = !!external;
  try {
    localStorage.setItem(KEY, JSON.stringify({ external: !!external, date: new Date().toISOString().slice(0, 10) }));
  } catch (_) { /* conservé en mémoire pour cette visite */ }
  bannerForced = false;
  emit();
}

export function reopenConsent() {
  bannerForced = true;
  emit();
}

/** true = accepté, false = refusé, null = pas encore de choix */
export function useConsent() {
  return useSyncExternalStore(subscribe, readChoice, () => null);
}

export function useBannerOpen() {
  const choice = useConsent();
  const forced = useSyncExternalStore(subscribe, () => bannerForced, () => false);
  return choice === null || forced;
}
