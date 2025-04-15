
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "¿Es seguro conectar mi cuenta de Mercado Libre?",
      answer: "Sí, es 100% seguro. Utilizamos el protocolo OAuth2 oficial de Mercado Libre, que es el mismo estándar que usan grandes plataformas como Google o Facebook. En ningún momento tenemos acceso a tus credenciales de Mercado Libre, solo a los datos que nos autorizás ver. Además, podés revocar el acceso en cualquier momento desde tu panel de Mercado Libre."
    },
    {
      question: "¿Puedo usar la app sin conexión API?",
      answer: "Sí, ofrecemos la opción de utilizar la aplicación subiendo archivos CSV con tus datos de ventas. Esta opción es ideal para quienes prefieren no conectar su cuenta o necesitan analizar datos históricos. Sin embargo, para aprovechar todas las funcionalidades en tiempo real, recomendamos la conexión vía API."
    },
    {
      question: "¿Qué información ve la app de mi cuenta de Mercado Libre?",
      answer: "La aplicación solo accede a la información necesaria para brindarte análisis de valor: datos de ventas, publicaciones, costos de envío, comisiones y mensajes relacionados con tus operaciones. No podemos modificar tus publicaciones, precios o cualquier otro aspecto de tu cuenta sin tu autorización explícita."
    },
    {
      question: "¿Cómo funciona el período de prueba de 7 días?",
      answer: "Al conectar tu cuenta, automáticamente iniciás un período de prueba de 7 días con acceso completo a todas las funcionalidades. No necesitás ingresar datos de pago para la prueba. Te enviaremos un recordatorio 2 días antes de que finalice el período para que puedas decidir si continuar con la suscripción."
    },
    {
      question: "¿Cómo agrego mis costos para calcular márgenes precisos?",
      answer: "Tenés dos opciones: carga manual de costos producto por producto o carga masiva mediante un archivo CSV. Una vez cargados, la aplicación calculará automáticamente tus márgenes netos considerando el costo de producto, comisiones de MeLi, costos de envío y cualquier descuento aplicado."
    },
    {
      question: "¿Puedo cancelar mi suscripción en cualquier momento?",
      answer: "Sí, podés cancelar tu suscripción cuando quieras desde tu panel de usuario. No hay contratos a largo plazo ni penalizaciones por cancelación. Si cancelás, mantendrás el acceso hasta el final del período facturado."
    },
    {
      question: "¿Ofrecen descuentos para planes anuales?",
      answer: "Actualmente trabajamos con un único plan mensual para mantener la simplicidad y flexibilidad para nuestros usuarios. Sin embargo, si tenés un volumen de productos muy alto o necesidades específicas, contactanos para analizar opciones personalizadas."
    }
  ];

  return (
    <section id="faq" className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas Frecuentes</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Encontrá respuestas a las dudas más comunes sobre Go For MeLi Metrics
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="mt-12 bg-gray-50 p-6 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">¿No encontrás la respuesta que buscás?</h3>
          <p className="text-gray-600 mb-4">
            Nuestro equipo está disponible para resolver todas tus dudas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://wa.me/5491100000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
              WhatsApp
            </a>
            <a 
              href="mailto:info@gofor.com.ar"
              className="inline-flex items-center justify-center gap-2 bg-gofor-purple text-white px-4 py-2 rounded-lg hover:bg-gofor-lightPurple transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
              </svg>
              Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
