import React from 'react';
import { Button } from "@/components/ui/button";
import MeliConnect from "./MeliConnect";
const Hero = () => {
  return <section id="hero" className="pt-20 lg:pt-28 pb-16 lg:pb-24 bg-gradient-to-br from-white to-gofor-warmWhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="gradient-text">Análisis en tiempo real</span> para tus ventas en Mercado Libre
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              Conocé tus márgenes reales, optimizá tu rentabilidad y tomá mejores decisiones con datos precisos y actualizados automáticamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <MeliConnect />
              <Button variant="outline" className="border-2 border-gofor-purple text-gofor-purple hover:bg-gofor-purple hover:text-white transition-all">
                Ver Demo
              </Button>
            </div>
            <div className="mt-8 flex items-center">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gofor-navy"></div>
                <div className="w-8 h-8 rounded-full bg-gofor-purple"></div>
                <div className="w-8 h-8 rounded-full bg-gofor-lightPurple"></div>
              </div>
              <p className="ml-4 text-sm text-gray-600">Más de 500 vendedores confían en nosotros</p>
            </div>
          </div>
          <div className="order-1 lg:order-2 relative">
            
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gofor-yellow rounded-lg -z-10"></div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gofor-lightPurple rounded-lg opacity-20 -z-10"></div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;