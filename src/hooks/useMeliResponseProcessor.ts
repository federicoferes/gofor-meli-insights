
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
  const [costData, setCostData] = useState<any[]>([
    { name: "Comisiones", value: 0 },
    { name: "Impuestos", value: 0 },
    { name: "Envíos", value: 0 }
  ]);
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [prevSalesSummary, setPrevSalesSummary] = useState<SalesSummary>(createEmptySalesSummary());
  
  const { toast } = useToast();

  const processResponseData = useCallback((batchData: any) => {
    console.log("🔄 Processing response data:", batchData);
    
    // Reset data first to ensure we don't display stale data
    setSalesData([]);
    setSalesSummary(createEmptySalesSummary());
    setTopProducts([]);
    setCostData([
      { name: "Comisiones", value: 0 },
      { name: "Impuestos", value: 0 },
      { name: "Envíos", value: 0 }
    ]);
    setProvinceData([]);
    setOrdersData([]);
    setPrevSalesSummary(createEmptySalesSummary());
    
    const isUsingTestData = !!batchData.is_test_data;
    setIsTestData(isUsingTestData);
    
    console.log(`🧪 Using test data: ${isUsingTestData ? 'YES' : 'NO'}`);
    
    if (batchData.dashboard_data) {
      console.log("Found dashboard_data:", batchData.dashboard_data);
      
      if (batchData.dashboard_data.salesByMonth?.length > 0) {
        console.log("Setting salesByMonth data:", batchData.dashboard_data.salesByMonth);
        setSalesData(batchData.dashboard_data.salesByMonth);
      } else {
        console.log("No salesByMonth data found or empty array");
        // Set empty sales data to prevent showing old data
        setSalesData([]);
      }
      
      if (batchData.dashboard_data.summary) {
        const processedSummary = processSalesSummary(batchData.dashboard_data.summary);
        console.log("Setting summary data:", processedSummary);
        setSalesSummary(processedSummary);
        
        logSalesSummaryToConsole(dateFilter, dateRange, processedSummary);
      } else {
        console.log("No summary data found");
        setSalesSummary(createEmptySalesSummary());
      }
      
      if (batchData.dashboard_data.prev_summary) {
        const prevProcessedSummary = processSalesSummary(batchData.dashboard_data.prev_summary);
        console.log("Setting prev_summary data:", prevProcessedSummary);
        setPrevSalesSummary(prevProcessedSummary);
      } else {
        console.log("No prev_summary data found");
        setPrevSalesSummary(createEmptySalesSummary());
      }
      
      if (batchData.dashboard_data.costDistribution?.length > 0) {
        console.log("Setting costDistribution data:", batchData.dashboard_data.costDistribution);
        setCostData(batchData.dashboard_data.costDistribution);
      } else {
        console.log("No costDistribution data found or empty array");
        // Set default cost distribution to prevent empty display
        setCostData([
          { name: "Comisiones", value: 0 },
          { name: "Impuestos", value: 0 },
          { name: "Envíos", value: 0 }
        ]);
      }
      
      if (batchData.dashboard_data.topProducts?.length > 0) {
        console.log("Setting topProducts data:", batchData.dashboard_data.topProducts);
        setTopProducts(batchData.dashboard_data.topProducts);
      } else {
        console.log("No topProducts data found or empty array");
        setTopProducts([]);
      }
      
      if (batchData.dashboard_data.salesByProvince?.length > 0) {
        console.log("Setting salesByProvince data:", batchData.dashboard_data.salesByProvince);
        setProvinceData(batchData.dashboard_data.salesByProvince);
      } else {
        console.log("No salesByProvince data found or empty array");
        setProvinceData([]);
      }
      
      if (batchData.dashboard_data.orders) {
        console.log("Setting orders data with", batchData.dashboard_data.orders.length, "orders");
        setOrdersData(batchData.dashboard_data.orders);
        
        if (productCostsCalculator) {
          const productCosts = productCostsCalculator(batchData.dashboard_data.orders);
          console.log("Calculated product costs:", productCosts);
          setSalesSummary(prev => ({ ...prev, productCosts }));
        }
      } else {
        console.log("No orders data found");
        setOrdersData([]);
      }
    } else if (!batchData.has_dashboard_data) {
      console.log("No dashboard_data found in response");
      
      setSalesSummary(createEmptySalesSummary());
      setPrevSalesSummary(createEmptySalesSummary());
      setSalesData([]);
      setCostData([
        { name: "Comisiones", value: 0 },
        { name: "Impuestos", value: 0 },
        { name: "Envíos", value: 0 }
      ]);
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
