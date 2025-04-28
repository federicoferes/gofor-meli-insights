
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', to: 'hero' },
    { name: 'Cómo Funciona', to: 'how-it-works' },
    { name: 'Funcionalidades', to: 'features' },
    { name: 'Precios', to: 'pricing' },
    { name: 'FAQ', to: 'faq' },
    { name: 'Contacto', to: 'contact' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gofor-purple">
                Go For <span className="text-gofor-yellow">MeLi</span> Metrics
              </h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <ScrollLink
                  key={link.name}
                  to={link.to}
                  smooth={true}
                  duration={500}
                  className="text-gray-700 hover:text-gofor-purple px-3 py-2 text-sm font-medium cursor-pointer"
                >
                  {link.name}
                </ScrollLink>
              ))}
              <RouterLink to="/login">
                <Button className="bg-gofor-purple hover:bg-gofor-lightPurple text-white">
                  Iniciar Sesión
                </Button>
              </RouterLink>
              <RouterLink to="/register">
                <Button variant="outline" className="border-2 border-gofor-purple text-gofor-purple hover:bg-gofor-purple hover:text-white">
                  Registro
                </Button>
              </RouterLink>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gofor-purple focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <ScrollLink
                key={link.name}
                to={link.to}
                smooth={true}
                duration={500}
                className="text-gray-700 hover:text-gofor-purple block px-3 py-2 text-base font-medium cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </ScrollLink>
            ))}
            <div className="flex flex-col space-y-2 mt-4">
              <RouterLink to="/login" className="w-full">
                <Button className="w-full bg-gofor-purple hover:bg-gofor-lightPurple text-white">
                  Iniciar Sesión
                </Button>
              </RouterLink>
              <RouterLink to="/register" className="w-full">
                <Button variant="outline" className="w-full border-2 border-gofor-purple text-gofor-purple hover:bg-gofor-purple hover:text-white">
                  Registro
                </Button>
              </RouterLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
