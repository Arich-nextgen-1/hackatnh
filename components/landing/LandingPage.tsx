'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import FAQSection from './FAQSection';
import Footer from './Footer';
import OnboardingModal from './OnboardingModal';

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      <HeroSection onStart={() => setIsModalOpen(true)} />
      <FeaturesSection />
      <FAQSection />
      <Footer />
      <AnimatePresence>
        {isModalOpen && (
          <OnboardingModal onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
