import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import PressSection from '@/components/home/PressSection';
import InstagramSection from '@/components/home/InstagramSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import FAQSection from '@/components/home/FAQSection';
import LibrairiesSection from '@/components/home/LibrairiesSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <TestimonialsSection />
      <LibrairiesSection />
      <PressSection />
      <InstagramSection />
      <NewsletterSection />
      <FAQSection />
    </>
  );
}
