import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import CatalogueSection from '@/components/home/CatalogueSection';
import MaisonSection from '@/components/home/MaisonSection';
import AuthorsCallout from '@/components/home/AuthorsCallout';
import PressSection from '@/components/home/PressSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <CatalogueSection />
      <MaisonSection />
      <AuthorsCallout />
      <PressSection />
    </>
  );
}
