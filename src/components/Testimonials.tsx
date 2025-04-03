
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Laura Martínez",
      role: "Vendedora de electrónicos",
      image: "https://randomuser.me/api/portraits/women/32.jpg",
      content: "Go For MeLi Metrics me permitió entender en profundidad los márgenes reales de mis productos. Descubrí que algunos de mis productos 'estrella' eran los menos rentables. Ahora tomo mejores decisiones basadas en datos concretos.",
      stars: 5
    },
    {
      name: "Martín Gómez",
      role: "Dueño de tienda de indumentaria",
      image: "https://randomuser.me/api/portraits/men/47.jpg",
      content: "Increíble el cambio que generó en mi negocio. Antes usaba Excel y me llevaba horas calcular costos y márgenes. Con Go For puedo ver en tiempo real cómo van mis ventas y mi rentabilidad. ¡Totalmente recomendado!",
      stars: 5
    },
    {
      name: "Carolina Sánchez",
      role: "Emprendedora PyME",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      content: "Lo que más me gusta es poder ver en tiempo real cómo impactan las comisiones y los costos de envío en mis ganancias finales. La integración con MeLi funciona a la perfección. El soporte técnico siempre responde rápido.",
      stars: 4
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Testimonios</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Lo que dicen nuestros usuarios sobre Go For MeLi Metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6">"{testimonial.content}"</p>
                
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 bg-gofor-purple/5 rounded-xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-center mb-6">Lo que aprecian nuestros usuarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: "94%", text: "Mejoró su rentabilidad" },
              { number: "87%", text: "Ahorra tiempo en análisis" },
              { number: "92%", text: "Recomendaría Go For MeLi" },
              { number: "3.5x", text: "ROI promedio" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-gofor-purple mb-2">{stat.number}</div>
                <div className="text-gray-700">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
