import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SalesSummary } from '@/types/meli';
import { createEmptySalesSummary } from '@/utils/meliDataProcessor';
import { logSalesSummaryToConsole } from '@/utils/consoleLogger';

interface UseMeliResponseProcessorProps {
  dateFilter: string;
  dateRange: {
    from?: Date;
    to?: Date;
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
    setIsTestData(!!batchData.is_test_data);
    
    if (batchData.dashboard_data) {
      if (batchData.dashboard_data.salesByMonth?.length > 0) {
        setSalesData(batchData.dashboard_data.salesByMonth);
      }
      
      if (batchData.dashboard_data.summary) {
        const summary = batchData.dashboard_data.summary;
        
        if (summary.visits > 0 && summary.units > 0) {
          summary.conversion = (summary.units / summary.visits) * 100;
        } else {
          summary.conversion = 0;
        }
        
        if (summary.gmv > 0 && summary.orders > 0) {
          summary.avgTicket = summary.gmv / summary.orders;
        } else {
          summary.avgTicket = 0;
        }
        
        setSalesSummary(summary);

        logSalesSummaryToConsole(dateFilter, dateRange, summary);
      }
      
      if (batchData.dashboard_data.prev_summary) {
        const prevSummary = batchData.dashboard_data.prev_summary;
        
        if (prevSummary.visits > 0 && prevSummary.units > 0) {
          prevSummary.conversion = (prevSummary.units / prevSummary.visits) * 100;
        } else {
          prevSummary.conversion = 0;
        }
        
        if (prevSummary.gmv > 0 && prevSummary.orders > 0) {
          prevSummary.avgTicket = prevSummary.gmv / prevSummary.orders;
        } else {
          prevSummary.avgTicket = 0;
        }
        
        setPrevSalesSummary(prevSummary);
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
      } else if (batchData.is_test_data) {
        setIsTestData(true);
        
        toast({
          title: "Mostrando datos de prueba",
          description: "No se encontraron órdenes reales para el período seleccionado",
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
