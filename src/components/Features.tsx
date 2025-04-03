
import React from 'react';
import { 
  BarChart3, LineChart, PieChart, TrendingUp, Clock, Download, 
  RefreshCcw, FileSpreadsheet, CreditCard, ShieldCheck, MessageSquare, UploadCloud 
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <BarChart3 className="h-10 w-10 text-gofor-purple" />,
      title: "Ventas en tiempo real",
      description: "Visualizá tus ventas diarias, semanales y mensuales con actualizaciones automáticas."
    },
    {
      icon: <LineChart className="h-10 w-10 text-gofor-purple" />,
      title: "Análisis de márgenes",
      description: "Conocé tu margen neto por producto después de comisiones, costos y descuentos."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-gofor-purple" />,
      title: "Ranking de productos",
      description: "Identificá rápidamente qué productos te generan mayor rentabilidad."
    },
    {
      icon: <UploadCloud className="h-10 w-10 text-gofor-purple" />,
      title: "Carga de costos",
      description: "Cargá tus costos de forma manual o automática para cálculos precisos."
    },
    {
      icon: <PieChart className="h-10 w-10 text-gofor-purple" />,
      title: "Dashboard personalizable",
      description: "Adaptá las métricas y visualizaciones a tus necesidades específicas."
    },
    {
      icon: <Download className="h-10 w-10 text-gofor-purple" />,
      title: "Reportes exportables",
      description: "Descargá informes financieros en formatos Excel o PDF para compartir fácilmente."
    },
    {
      icon: <FileSpreadsheet className="h-10 w-10 text-gofor-purple" />,
      title: "Importación CSV",
      description: "Usá la app sin conexión API cargando archivos CSV con tus datos de ventas."
    },
    {
      icon: <RefreshCcw className="h-10 w-10 text-gofor-purple" />,
      title: "Sincronización automática",
      description: "Tus datos siempre actualizados sin necesidad de intervención manual."
    }
  ];

  const additionalFeatures = [
    { icon: <Clock />, text: "7 días de prueba gratis" },
    { icon: <CreditCard />, text: "USD 20/mes todo incluido" },
    { icon: <ShieldCheck />, text: "100% seguro y confiable" },
    { icon: <MessageSquare />, text: "Soporte técnico incluido" }
  ];

  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades principales</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Todo lo que necesitás para entender y mejorar la rentabilidad de tu negocio en Mercado Libre
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
              <span className="text-gofor-purple">{feature.icon}</span>
              <span className="text-gray-700 font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
