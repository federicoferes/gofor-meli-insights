
import React from 'react';
import { Check, ArrowRight, Link, BarChart2, DollarSign } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Te registrás y conectás tu cuenta",
      description: "Vinculá tu cuenta de Mercado Libre con un simple click. Es un proceso seguro y autorizado por Mercado Libre.",
      icon: <Link className="w-10 h-10 text-white" />,
      color: "bg-gofor-purple"
    },
    {
      number: 2,
      title: "Analizamos tus datos en segundos",
      description: "Nuestro sistema procesa automáticamente tus ventas, productos y costos asociados en tiempo real.",
      icon: <BarChart2 className="w-10 h-10 text-white" />,
      color: "bg-gofor-lightPurple"
    },
    {
      number: 3,
      title: "Te mostramos cuánto vendiste y ganaste realmente",
      description: "Visualizá tus márgenes netos, descontando comisiones, logística y otros costos operativos.",
      icon: <DollarSign className="w-10 h-10 text-white" />,
      color: "bg-gofor-yellow"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Cómo Funciona</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Go For MeLi Metrics te permite conocer el estado real de tu negocio en Mercado Libre en 3 simples pasos
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg relative group hover:shadow-xl transition-all">
              <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-6`}>
                {step.icon}
              </div>
              
              <span className="absolute top-4 right-4 text-4xl font-bold text-gray-100 group-hover:text-gofor-purple transition-colors">
                {step.number}
              </span>
              
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-gofor-purple" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-white p-6 rounded-xl shadow border border-gray-100 max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">Beneficios Inmediatos:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Conocé tus márgenes reales",
              "Identificá productos más rentables",
              "Optimizá tu inversión en stock",
              "Calculá tus impuestos fácilmente",
              "Detectá tendencias de ventas",
              "Tomá decisiones basadas en datos"
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-gofor-purple mt-1 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
