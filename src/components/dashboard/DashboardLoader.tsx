
import React from 'react';
import { Loader2 } from 'lucide-react';

interface DashboardLoaderProps {
  message?: string;
  loadingData?: boolean;
  showProgress?: boolean;
  error?: string | null;
}

const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  message = "Cargando datos de Mercado Libre...",
  loadingData = true,
  showProgress = false,
  error = null
}) => {
  const [dots, setDots] = React.useState('.');
  
  // Animate the dots for better user experience
  React.useEffect(() => {
    if (loadingData) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '.';
          if (prev === '..') return '...';
          if (prev === '.') return '..';
          return '.';
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [loadingData]);
  
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-xl">
          <h3 className="text-red-700 font-semibold mb-2">Error al cargar datos</h3>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">Intenta recargar la página o cambiar el rango de fechas.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col justify-center items-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-gofor-purple mb-4" />
      <span className="text-gofor-purple font-medium">{message}{dots}</span>
      {loadingData && (
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-500 mt-2">Este proceso puede tardar unos segundos...</span>
          {showProgress && (
            <div className="w-64 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-gofor-purple animate-pulse"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardLoader;
