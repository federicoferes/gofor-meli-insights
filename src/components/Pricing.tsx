
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from 'lucide-react';
import MeliConnect from './MeliConnect';

const Pricing = () => {
  const features = [
    "Dashboard de ventas en tiempo real",
    "Análisis de márgenes por producto",
    "Ranking de productos rentables",
    "Carga manual y automática de costos",
    "Exportación de reportes",
    "Sincronización automática con MeLi",
    "Soporte técnico y comercial",
    "Actualizaciones constantes"
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Plan y precios</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Una inversión simple que te ayudará a maximizar la rentabilidad de tu negocio
          </p>
        </div>
        
        <Card className="shadow-xl border-0 overflow-hidden gradient-border">
          <div className="absolute top-0 right-0 bg-gofor-yellow py-1 px-4 rotate-45 translate-x-8 translate-y-4 text-gofor-navy font-semibold">
            Popular
          </div>
          
          <CardHeader className="bg-gray-50 border-b border-gray-100 text-center py-10">
            <CardTitle className="text-3xl font-bold">Plan Completo</CardTitle>
            <CardDescription className="text-lg mt-2">Todas las funciones que necesitás</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 px-8">
            <div className="text-center mb-8">
              <span className="text-5xl font-bold">USD 20</span>
              <span className="text-gray-500 ml-2">/mes</span>
              <p className="text-gray-600 mt-2">Facturación mensual. Sin contratos a largo plazo.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Check className="h-5 w-5 text-gofor-purple mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 -mx-8 mt-8 p-4 border-t border-b border-gray-100">
              <div className="flex items-center justify-center gap-2">
                <span className="bg-gofor-purple/10 text-gofor-purple text-sm font-medium px-3 py-1 rounded-full">
                  7 días de prueba gratuita
                </span>
                <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  Cancelá cuando quieras
                </span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center pb-8 pt-4 px-8">
            <MeliConnect />
          </CardFooter>
        </Card>
        
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">¿Tenés dudas sobre nuestro plan?</h3>
          <p className="text-gray-600 mb-6">
            Contactanos para más información o para solicitar una demo personalizada.
          </p>
          <Button variant="outline" className="border-2 border-gofor-purple text-gofor-purple hover:bg-gofor-purple hover:text-white">
            Contactar a ventas
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
