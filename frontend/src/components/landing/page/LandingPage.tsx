import React from 'react';
import { MainNavbar } from '../layout/Navbar';
import { HeroSection } from '../sections/hero/hero-section';
import { BentoGridSection } from '../sections/features/BentoGridSection';
import { FeaturesBentoSection } from '../sections/features/FeaturesBentoSection';
import { FaqSection } from '../sections/faq/FaqSection';
import { SplineSection } from '../sections/features/SplineSection';
import { Footer } from '../layout/Footer';

export default function LandingPage() {
  return (
    <main className="flex flex-col bg-white">
      <MainNavbar />
      <div className="pt-16">
        <HeroSection />
      
        <BentoGridSection />
        <div className="w-full flex flex-col items-center justify-between bg-background dark">
          <FeaturesBentoSection />
          <FaqSection />
          <SplineSection />
          <Footer />
        </div>
      </div>
    </main>
  );
} 