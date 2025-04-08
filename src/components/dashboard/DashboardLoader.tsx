
import React from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLoaderProps {
  message?: string;
  loadingData?: boolean;
  showProgress?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isAuthError?: boolean;
}

const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  message = "Cargando datos de Mercado Libre...",
  loadingData = true,
  showProgress = false,
  error = null,
  onRetry,
  isAuthError = false
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-xl w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-red-700 font-semibold">{isAuthError ? "Error de autenticación" : "Error al cargar datos"}</h3>
          </div>
          
          <p className="text-red-600">{error}</p>
          
          {isAuthError ? (
            <div className="mt-6 text-sm text-gray-600">
              <p className="mb-2">El error puede ser causado por un problema de autenticación con Mercado Libre.</p>
              <p>Intenta reconectar tu cuenta desde el botón "Conectar con Mercado Libre" en la esquina superior derecha.</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              Intenta recargar la página o cambiar el rango de fechas.
            </p>
          )}
          
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline"
              className="mt-4 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}
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
