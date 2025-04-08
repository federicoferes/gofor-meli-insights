import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SalesSummary } from '@/types/meli';
import { createEmptySalesSummary, processSalesSummary } from '@/utils/meliDataProcessor';
import { logSalesSummaryToConsole } from '@/utils/consoleLogger';

interface UseMeliResponseProcessorProps {
  dateFilter: string;
  dateRange: {
    from?: Date;
    to?: Date;
    fromISO?: string;
    toISO?: string;
  };
  finalDisableTestData: boolean;
  productCostsCalculator?: (orders: any[]) => number;
}

export function useMeliResponseProcessor({
  dateFilter,
  dateRange,
  finalDisableTestData,
  productCostsCalculator
}: UseMeliResponseProcessorProps) {
  const [isTestData, setIsTestData] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>(createEmptySalesSummary());
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [prevSalesSummary, setPrevSalesSummary] = useState<SalesSummary>(createEmptySalesSummary());
  
  const { toast } = useToast();

  const processResponseData = useCallback((batchData: any) => {
    const isUsingTestData = !!batchData.is_test_data;
    setIsTestData(isUsingTestData);
    
    console.log(`🧪 Using test data: ${isUsingTestData ? 'YES' : 'NO'}`);
    
    if (batchData.dashboard_data) {
      if (batchData.dashboard_data.salesByMonth?.length > 0) {
        setSalesData(batchData.dashboard_data.salesByMonth);
      }
      
      if (batchData.dashboard_data.summary) {
        const processedSummary = processSalesSummary(batchData.dashboard_data.summary);
        setSalesSummary(processedSummary);
        
        logSalesSummaryToConsole(dateFilter, dateRange, processedSummary);
      }
      
      if (batchData.dashboard_data.prev_summary) {
        const prevProcessedSummary = processSalesSummary(batchData.dashboard_data.prev_summary);
        setPrevSalesSummary(prevProcessedSummary);
      }
      
      if (batchData.dashboard_data.costDistribution?.length > 0) {
        setCostData(batchData.dashboard_data.costDistribution);
      }
      
      if (batchData.dashboard_data.topProducts?.length > 0) {
        setTopProducts(batchData.dashboard_data.topProducts);
      }
      
      if (batchData.dashboard_data.salesByProvince?.length > 0) {
        setProvinceData(batchData.dashboard_data.salesByProvince);
      }
      
      if (batchData.dashboard_data.orders) {
        setOrdersData(batchData.dashboard_data.orders);
        
        if (productCostsCalculator) {
          const productCosts = productCostsCalculator(batchData.dashboard_data.orders);
          setSalesSummary(prev => ({ ...prev, productCosts }));
        }
      }
    } else if (!batchData.has_dashboard_data) {
      setSalesSummary(createEmptySalesSummary());
      setPrevSalesSummary(createEmptySalesSummary());
      setSalesData([]);
      setCostData([]);
      setTopProducts([]);
      setProvinceData([]);
      setOrdersData([]);
      
      if (finalDisableTestData) {
        toast({
          title: "Sin datos del dashboard",
          description: "No se encontraron órdenes para el período seleccionado",
          variant: "destructive",
          duration: 5000
        });
      } else if (isUsingTestData) {
        toast({
          title: "Mostrando datos de prueba",
          description: "No se encontraron órdenes reales para el período seleccionado",
          variant: "default",
          duration: 5000
        });
      }
    }
  }, [dateFilter, dateRange, finalDisableTestData, productCostsCalculator, toast]);

  return {
    processResponseData,
    salesData,
    salesSummary,
    topProducts,
    costData,
    provinceData,
    prevSalesSummary,
    ordersData,
    isTestData
  };
}
