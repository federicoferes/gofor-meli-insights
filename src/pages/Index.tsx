
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Dashboard from '@/components/Dashboard';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import ConfigurationGuide from '@/components/ConfigurationGuide';
import { Button } from '@/components/ui/button';
import { Link as ScrollLink } from 'react-scroll';
import { ArrowUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Dashboard />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
      <ConfigurationGuide />
      <Footer />
      
      {/* Scroll to top button */}
      <div className="fixed bottom-6 right-6 z-50">
        <ScrollLink to="hero" smooth={true} duration={500}>
          <Button 
            size="icon" 
            className="rounded-full h-12 w-12 bg-gofor-purple hover:bg-gofor-lightPurple shadow-lg"
            aria-label="Volver arriba"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        </ScrollLink>
      </div>
    </div>
  );
};

export default Index;
