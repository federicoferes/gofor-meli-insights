
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
      question: "¿Qué es Go For MeLi Metrics y cómo me ayuda a vender más en Mercado Libre?",
      answer: "Go For MeLi Metrics es una plataforma de análisis enfocada exclusivamente en vendedores de Mercado Libre que te permite visualizar y entender todos tus datos de ventas, costos, comisiones e impuestos en un solo lugar. Te ayuda a vender más porque te proporciona información clara sobre qué productos son más rentables, cuándo es el mejor momento para vender, y dónde están tus mayores gastos, permitiéndote tomar decisiones estratégicas basadas en datos reales."
    },
    {
      question: "¿Cómo funciona la conexión con mi cuenta de Mercado Libre? ¿Es segura?",
      answer: "La conexión es 100% segura y utiliza el protocolo OAuth2 oficial de Mercado Libre, el mismo estándar que usan grandes plataformas como Google o Facebook. En ningún momento tenemos acceso a tus credenciales, solo a los datos que nos autorizás ver. El proceso es muy simple: hacés clic en 'Conectar con MeLi', iniciás sesión en tu cuenta de Mercado Libre y autorizás el acceso. Podés revocar este permiso en cualquier momento desde tu panel de Mercado Libre."
    },
    {
      question: "¿Puedo calcular mi rentabilidad real teniendo en cuenta todos los costos y comisiones?",
      answer: "¡Absolutamente! Esta es una de las principales ventajas de Go For MeLi Metrics. La plataforma calcula automáticamente tu rentabilidad real integrando todos los costos asociados: comisiones de Mercado Libre, costos de Mercado Pago, impuestos, costos de envío, descuentos aplicados, y por supuesto, tus costos de productos que puedes cargar manualmente o mediante un archivo CSV. Esto te da una visión precisa de tu margen neto en cada venta."
    },
    {
      question: "¿Cuáles son las métricas más importantes que puedo analizar con Go For MeLi Metrics?",
      answer: "Nuestra plataforma te permite analizar métricas cruciales como: GMV (Gross Merchandise Value), número de órdenes, ticket promedio, tasa de conversión, distribución de costos (comisiones, impuestos, envíos), rentabilidad por producto y categoría, productos más vendidos, tendencias de ventas a lo largo del tiempo, fuentes de tráfico y comportamiento de compradores. Todas estas métricas están diseñadas para darte una visión completa del rendimiento de tu negocio en Mercado Libre."
    },
    {
      question: "¿Go For MeLi Metrics puede ayudarme a mejorar mi posicionamiento en Mercado Libre?",
      answer: "Sí, aunque no de forma directa, la plataforma te proporciona información valiosa que puedes utilizar para mejorar tu estrategia de posicionamiento. Por ejemplo, te muestra qué productos tienen mayor tasa de conversión, qué días de la semana generan más ventas, o qué categorías tienen mejor rendimiento. Con estos datos, puedes ajustar tus publicaciones, precios, o inventario para maximizar tu visibilidad y ventas en Mercado Libre."
    },
    {
      question: "¿Cómo me ayuda Go For MeLi Metrics a optimizar mis costos de venta?",
      answer: "La plataforma te proporciona un desglose detallado de todos tus costos asociados a cada venta: comisiones de Mercado Libre, costos de procesamiento de pagos, impuestos, envíos, y más. Con esta información puedes identificar rápidamente dónde están tus mayores gastos y tomar medidas para optimizarlos. Por ejemplo, podrías descubrir que ciertos productos tienen costos de envío desproporcionados, o que las comisiones en algunas categorías están afectando seriamente tu margen."
    },
    {
      question: "¿Puedo comparar mi rendimiento actual con períodos anteriores?",
      answer: "Sí, una de las funcionalidades más potentes de Go For MeLi Metrics es la capacidad de comparar tu rendimiento actual con períodos anteriores. Puedes ver cómo han evolucionado tus ventas, conversion rates, ticket promedio y otros KPIs importantes a lo largo del tiempo. Esto te permite identificar tendencias, evaluar el impacto de tus estrategias comerciales, y detectar oportunidades o problemas emergentes en tu negocio de Mercado Libre."
    },
    {
      question: "¿Necesito conocimientos técnicos para usar Go For MeLi Metrics?",
      answer: "No, la plataforma está diseñada para ser intuitiva y fácil de usar, incluso si no tienes conocimientos técnicos. La interfaz es visual y todos los gráficos e indicadores son autoexplicativos. Además, ofrecemos tours guiados al iniciar y soporte permanente para ayudarte a aprovechar al máximo la herramienta. Cualquier vendedor de Mercado Libre puede comenzar a obtener insights valiosos desde el primer día de uso."
    },
    {
      question: "¿Puedo exportar los datos y análisis para presentarlos a mi equipo o socios?",
      answer: "Sí, Go For MeLi Metrics te permite exportar todos los datos, gráficos y análisis en varios formatos, incluyendo PDF, Excel y CSV. Esto es especialmente útil si necesitas compartir información con tu equipo de ventas, contadores, o socios comerciales. También puedes programar informes periódicos para que se envíen automáticamente por email a las personas que designes."
    },
    {
      question: "¿Cómo se compara Go For MeLi Metrics con las herramientas oficiales de Mercado Libre?",
      answer: "Mientras que las herramientas oficiales de Mercado Libre proporcionan información básica sobre tus ventas, Go For MeLi Metrics ofrece un análisis mucho más profundo y orientado a la toma de decisiones. Nuestra plataforma integra datos de múltiples fuentes, calcula métricas avanzadas como rentabilidad real, y presenta todo de manera visualmente intuitiva. Además, te permite realizar análisis comparativos, proyecciones y simulaciones que no están disponibles en las herramientas oficiales."
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
              href="https://wa.me/13025729025" 
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
              href="mailto:hola@gfmarketing.com.ar"
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
