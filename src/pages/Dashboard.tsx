
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DebugButton from '@/components/DebugButton';
import { useMeliData } from '@/hooks/useMeliData';
import { useProducts } from '@/hooks/useProducts';
import DashboardLoader from '@/components/dashboard/DashboardLoader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SalesSummaryCards from '@/components/dashboard/SalesSummaryCards';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

const calculateBalance = (
  gmv: number, 
  commissions: number, 
  shipping: number, 
  taxes: number, 
  ivaRate: number, 
  advertising: number = 0, 
  productCosts: number = 0
) => {
  const iva = (gmv * ivaRate) / 100;
  return gmv - commissions - shipping - taxes - iva - advertising - productCosts;
};

const Dashboard = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meliConnected, setMeliConnected] = useState(false);
  const [meliUser, setMeliUser] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date, 
    to?: Date,
    fromISO?: string,
    toISO?: string
  }>({});
  const [ivaRate, setIvaRate] = useState(21);
  const [activeTab, setActiveTab] = useState('ventas');

  const { toast } = useToast();
  const isMounted = useRef(true);

  const { 
    products, 
    isLoading: productsLoading, 
    fetchProducts, 
    updateProductCost, 
    calculateSoldProductsCost 
  } = useProducts({
    userId: session?.user?.id,
    meliUserId: meliUser,
    dateFilter,
    dateRange: customDateRange,
    isConnected: meliConnected
  });

  const {
    isLoading: dataLoading,
    salesData,
    salesSummary,
    topProducts,
    costData,
    provinceData,
    prevSalesSummary,
    ordersData,
    refresh: refreshData,
    isTestData,
    error: dataError
  } = useMeliData({
    userId: session?.user?.id,
    meliUserId: meliUser,
    dateFilter,
    dateRange: customDateRange,
    isConnected: meliConnected,
    productCostsCalculator: calculateSoldProductsCost
  });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted.current) return;
      
      setSession(session);
      
      if (session) {
        try {
          const { data: connectionData, error } = await supabase.functions.invoke('meli-data', {
            body: { user_id: session.user.id }
          });
          
          if (!isMounted.current) return;
          
          if (!error && connectionData?.is_connected) {
            setMeliConnected(true);
            setMeliUser(connectionData.meli_user_id);
            console.log("MeLi connection verified:", connectionData);
          } else {
            console.log("Not connected to MeLi yet:", connectionData, error);
          }
        } catch (error) {
          console.error("Error checking MeLi connection:", error);
        }
      }
      
      setLoading(false);
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted.current) return;
      
      setSession(session);
      
      if (session) {
        supabase.functions.invoke('meli-data', {
          body: { user_id: session.user.id }
        }).then(({ data, error }) => {
          if (!isMounted.current) return;
          
          if (!error && data?.is_connected) {
            setMeliConnected(true);
            setMeliUser(data.meli_user_id);
          } else {
            setMeliConnected(false);
          }
        });
      } else {
        setMeliConnected(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleDateRangeChange = (range: string, dates?: { 
    from: Date | undefined; 
    to: Date | undefined;
    fromISO?: string;
    toISO?: string;
  }) => {
    if (range === dateFilter && 
        ((range !== 'custom') || 
         (customDateRange.fromISO === dates?.fromISO && 
          customDateRange.toISO === dates?.toISO))) {
      console.log("📅 Ignorando cambio de fecha duplicado");
      return;
    }
    
    console.log(`📅 Date range changed to: ${range}`, dates);
    setDateFilter(range);
    if (dates) {
      setCustomDateRange({
        from: dates.from,
        to: dates.to,
        fromISO: dates.fromISO,
        toISO: dates.toISO
      });
    }
  };

  const handleIvaRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(event.target.value);
    if (!isNaN(newRate) && newRate >= 0 && newRate <= 100) {
      setIvaRate(newRate);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gofor-warmWhite">
        <Loader2 className="h-8 w-8 animate-spin text-gofor-purple" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const currentBalance = calculateBalance(
    salesSummary.gmv || 0, 
    salesSummary.commissions || 0, 
    salesSummary.shipping || 0, 
    salesSummary.taxes || 0, 
    ivaRate,
    salesSummary.advertising || 0,
    salesSummary.productCosts || 0
  );

  const previousBalance = calculateBalance(
    prevSalesSummary.gmv || 0, 
    prevSalesSummary.commissions || 0, 
    prevSalesSummary.shipping || 0, 
    prevSalesSummary.taxes || 0, 
    ivaRate,
    prevSalesSummary.advertising || 0,
    prevSalesSummary.productCosts || 0
  );

  const currentIva = ((salesSummary.gmv || 0) * ivaRate) / 100;
  const previousIva = ((prevSalesSummary.gmv || 0) * ivaRate) / 100;

  const costDistributionData = [
    { name: 'Comisiones', value: salesSummary.commissions || 0 },
    { name: 'Impuestos', value: salesSummary.taxes || 0 },
    { name: 'Envíos', value: salesSummary.shipping || 0 },
    { name: 'IVA', value: currentIva || 0 },
    ...(salesSummary.advertising > 0 ? [{ name: 'Publicidad', value: salesSummary.advertising }] : []),
    ...(salesSummary.productCosts > 0 ? [{ name: 'Costo de productos', value: salesSummary.productCosts }] : [])
  ];

  return (
    <div className="min-h-screen bg-gofor-warmWhite font-poppins p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader 
          userName={session?.user?.user_metadata?.first_name}
          meliConnected={meliConnected}
          onDateRangeChange={handleDateRangeChange}
          isTestData={isTestData}
          error={dataError}
        />

        {meliConnected && (
          <>
            {dataLoading ? (
              <DashboardLoader />
            ) : (
              <>
                <SalesSummaryCards 
                  salesSummary={salesSummary}
                  prevSalesSummary={prevSalesSummary}
                  isLoading={dataLoading}
                  isTestData={isTestData}
                  currentBalance={currentBalance}
                  previousBalance={previousBalance}
                  currentIva={currentIva}
                  previousIva={previousIva}
                  ivaRate={ivaRate}
                  onIvaRateChange={handleIvaRateChange}
                />
                
                <DashboardTabs 
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  salesData={salesData}
                  costData={costData}
                  provinceData={provinceData}
                  topProducts={topProducts}
                  products={products}
                  productsLoading={productsLoading}
                  costDistributionData={costDistributionData}
                  salesSummary={{...salesSummary, ivaRate}}
                  isLoading={dataLoading}
                  onRefreshData={refreshData}
                  onFetchProducts={fetchProducts}
                  onUpdateProductCost={updateProductCost}
                />
              </>
            )}
          </>
        )}
      </div>
      
      <DebugButton 
        dateFilter={dateFilter}
        dateRange={customDateRange}
        salesSummary={salesSummary}
        userId={session?.user?.id}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default Dashboard;
