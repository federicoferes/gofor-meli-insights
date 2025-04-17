
import React from 'react';
import { Link } from 'react-router-dom';
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
    <div className="min-h-screen relative" id="hero">
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
      
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col gap-3">
          <Link to="/register">
            <Button 
              className="rounded-full h-12 w-12 bg-gofor-purple hover:bg-gofor-lightPurple shadow-lg"
              aria-label="Registrarte"
            >
              <span className="sr-only">Registrarte</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </Button>
          </Link>
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
    </div>
  );
};

export default Index;
