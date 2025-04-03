
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, Phone } from "lucide-react";

const Contact = () => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // This would be connected to your backend for form submission
    console.log("Form submitted");
    // In a real implementation, you would connect this to Supabase
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Contacto</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            ¿Tenés preguntas o necesitás ayuda? Estamos aquí para asistirte
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Envianos un mensaje</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nombre completo</label>
                  <Input id="name" placeholder="Tu nombre" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input id="email" type="email" placeholder="Tu email" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">Asunto</label>
                <Input id="subject" placeholder="¿Sobre qué querés consultar?" required />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Mensaje</label>
                <Textarea 
                  id="message" 
                  placeholder="Detallá tu consulta aquí..." 
                  rows={5} 
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full bg-gofor-purple hover:bg-gofor-lightPurple">
                Enviar mensaje
              </Button>
            </form>
          </div>
          
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Información de contacto</h3>
              
              <div className="space-y-6">
                <Card>
                  <CardContent className="flex items-start gap-4 p-6">
                    <Mail className="h-6 w-6 text-gofor-purple mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Email</h4>
                      <p className="text-gray-600">hola@gfmarketing.com.ar</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="flex items-start gap-4 p-6">
                    <Phone className="h-6 w-6 text-gofor-purple mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Teléfono</h4>
                      <p className="text-gray-600">+1 302 572-9025</p>
                      <p className="text-sm text-gray-500">Lunes a Viernes: 9:00 - 18:00</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="flex items-start gap-4 p-6">
                    <MessageSquare className="h-6 w-6 text-gofor-purple mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">WhatsApp</h4>
                      <p className="text-gray-600">+1 302 572-9025</p>
                      <p className="text-sm text-gray-500">Respondemos en minutos</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="mt-12 bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h4 className="font-semibold mb-4">Horario de atención</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lunes - Viernes:</span>
                  <span className="font-medium">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sábados:</span>
                  <span className="font-medium">10:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domingos:</span>
                  <span className="font-medium">Cerrado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
