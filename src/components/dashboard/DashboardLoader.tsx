
import React from 'react';
import { Loader2 } from 'lucide-react';

interface DashboardLoaderProps {
  message?: string;
  loadingData?: boolean;
}

const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  message = "Cargando datos de Mercado Libre...",
  loadingData = true
}) => {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-gofor-purple mb-4" />
      <span className="text-gofor-purple font-medium">{message}</span>
      {loadingData && (
        <span className="text-sm text-gray-500 mt-2">Este proceso puede tardar unos segundos...</span>
      )}
    </div>
  );
};

export default DashboardLoader;
