
import React from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import { Alert, AlertDescription } from "@/components/ui/alert";
import MeliConnect from '@/components/MeliConnect';

interface DashboardHeaderProps {
  userName: string | undefined;
  meliConnected: boolean;
  onDateRangeChange: (range: string, dates?: { 
    from: Date | undefined; 
    to: Date | undefined;
    fromISO?: string;
    toISO?: string;
  }) => void;
  isTestData: boolean;
  error: string | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  meliConnected,
  onDateRangeChange,
  isTestData,
  error
}) => {
  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gofor-purple">Dashboard de Ventas</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {userName || 'Usuario'}
          </p>
        </div>
        
        {meliConnected && (
          <DateRangePicker onDateRangeChange={onDateRangeChange} />
        )}
      </header>

      {!meliConnected ? (
        <Alert className="mb-8 bg-amber-50 border-amber-200">
          <AlertDescription className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-amber-800 mb-2">Conectá tu cuenta de Mercado Libre</h3>
                <p className="text-amber-700">Para ver tus métricas de ventas, necesitas conectar tu cuenta de Mercado Libre.</p>
              </div>
              <MeliConnect />
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {isTestData && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertDescription>
            <div className="flex items-center text-amber-800">
              <span className="text-sm">⚠️ Mostrando datos de prueba porque no se encontraron órdenes reales para el período seleccionado</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertDescription>
            <div className="flex items-center text-red-800">
              <span className="text-sm">❌ Error: {error}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default DashboardHeader;
