
import React from 'react';
import { Loader2 } from 'lucide-react';

interface DashboardLoaderProps {
  message?: string;
}

const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  message = "Cargando datos de Mercado Libre..."
}) => {
  return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-gofor-purple mr-2" />
      <span className="text-gofor-purple font-medium">{message}</span>
    </div>
  );
};

export default DashboardLoader;
