import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, DollarSign, ShoppingBag, CreditCard, Users, BarChart3, Percent, Truck } from "lucide-react";
import MeliConnect from '@/components/MeliConnect';
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DateRangePicker from '@/components/DateRangePicker';
import SummaryCard from '@/components/SummaryCard';
import { formatCurrency, formatNumber, formatPercent, calculateBalance } from '@/lib/formatters';
import { Alert, AlertDescription } from "@/components/ui/alert";
import DebugButton from '@/components/DebugButton';

const COLORS = ['#663399', '#FFD700', '#8944EB', '#FF8042', '#9B59B6', '#4ade80'];

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [meliConnected, setMeliConnected] = useState(false);
  const [meliUser, setMeliUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date, 
    to?: Date,
    fromISO?: string,
    toISO?: string
  }>({});
  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    gmv: 0,
    commissions: 0,
    taxes: 0,
    shipping: 0,
    discounts: 0,
    refunds: 0,
    iva: 0,
    units: 0,
    avgTicket: 0,
    visits: 0,
    conversion: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [costData, setCostData] = useState([]);
  const [provinceData, setProvinceData] = useState([]);
  const [prevSalesSummary, setPrevSalesSummary] = useState({
    gmv: 0,
    commissions: 0,
    taxes: 0,
    shipping: 0,
    discounts: 0,
    refunds: 0,
    iva: 0,
    units: 0,
    avgTicket: 0,
    visits: 0,
    conversion: 0
  });
  const { toast } = useToast();
  
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);
  const isMounted = useRef(true);
  
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

  const handleDateRangeChange = useCallback((range: string, dates?: { 
    from: Date | undefined; 
    to: Date | undefined;
    fromISO?: string;
    toISO?: string;
  }) => {
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
    setDataFetchAttempted(false);
  }, []);

  const loadMeliData = useCallback(async () => {
    if (!session?.user?.id || !meliConnected || !meliUser) {
      console.log("Skipping data load - not connected or no user ID", { session, meliConnected, meliUser });
      return;
    }
    
    if (dataLoading) {
      console.log("Already loading data, skipping duplicate fetch");
      return;
    }
    
    if (dateFilter === 'custom' && (!customDateRange.fromISO || !customDateRange.toISO)) {
      console.log("⚠️ Custom date range is incomplete. Skipping data fetch.");
      return;
    }
    
    try {
      setDataLoading(true);
      console.log("🔁 Running loadMeliData with filter:", dateFilter);
      
      let dateFrom, dateTo;
      
      if (dateFilter === 'custom' && customDateRange.fromISO && customDateRange.toISO) {
        dateFrom = customDateRange.fromISO;
        dateTo = customDateRange.toISO;
      } else {
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];
        
        let fromDate = new Date(today);
        switch(dateFilter) {
          case 'today':
            break;
          case 'yesterday':
            fromDate.setDate(today.getDate() - 1);
            break;
          case '7d':
            fromDate.setDate(today.getDate() - 7);
            break;
          case '30d':
            fromDate.setDate(today.getDate() - 30);
            break;
          default:
            fromDate.setDate(today.getDate() - 30);
        }
        
        const formattedFrom = fromDate.toISOString().split('T')[0];
        dateFrom = `${formattedFrom}T00:00:00.000Z`;
        dateTo = `${formattedToday}T23:59:59.999Z`;
      }
      
      console.log("🟣 Filtro aplicado:", dateFilter);
      console.log("📅 Selected date range:", { dateFrom, dateTo });
      
      const ordersRequest = {
        endpoint: '/orders/search',
        params: {
          seller: meliUser,
          'order.status': 'paid',
          sort: 'date_desc',
          date_from: dateFrom,
          date_to: dateTo
        }
      };
      
      const batchRequests = [
        ordersRequest,
        {
          endpoint: `/users/${meliUser}/items/search`
        },
        {
          endpoint: `/visits/search`,
          params: {
            user_id: meliUser
          }
        }
      ];
      
      const requestPayload = {
        user_id: session.user.id,
        batch_requests: batchRequests,
        date_range: {
          begin: dateFrom ? dateFrom.split('T')[0] : null,
          end: dateTo ? dateTo.split('T')[0] : null
        },
        prev_period: true
      };
      
      console.log("🚀 Enviando a Supabase:", requestPayload);
      
      const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
        body: requestPayload
      });
      
      if (!isMounted.current) return;
      
      if (batchError) {
        throw new Error(`Error fetching batch data: ${batchError.message}`);
      }
      
      if (!batchData || !batchData.success) {
        throw new Error(batchData?.message || 'Error fetching batch data');
      }
      
      console.log("✅ Batch data received:", batchData);
      
      if (batchData.dashboard_data) {
        if (batchData.dashboard_data.salesByMonth?.length > 0) {
          setSalesData(batchData.dashboard_data.salesByMonth);
        }
        
        if (batchData.dashboard_data.summary) {
          setSalesSummary(batchData.dashboard_data.summary);
        }
        
        if (batchData.dashboard_data.prev_summary) {
          setPrevSalesSummary(batchData.dashboard_data.prev_summary);
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
      } else {
        console.warn("⚠️ Dashboard data is missing in the API response");
      }
      
      toast({
        title: "Datos cargados",
        description: `Se han cargado los datos de Mercado Libre para el período: ${dateFilter}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error loading Mercado Libre data:", error);
      toast({
        variant: "destructive",
        title: "Error cargando datos",
        description: error.message || "No se pudieron cargar los datos de Mercado Libre."
      });
    } finally {
      if (isMounted.current) {
        setDataLoading(false);
        setDataFetchAttempted(true);
      }
    }
  }, [session, meliConnected, meliUser, dateFilter, customDateRange, toast]);

  useEffect(() => {
    if (!dataLoading && 
        !dataFetchAttempted && 
        meliConnected && 
        session?.user?.id && 
        meliUser) {
          
      const validDateRange = dateFilter !== 'custom' || 
                           (customDateRange.fromISO && customDateRange.toISO);
      
      if (validDateRange) {
        console.log("🔄 Conditions met, triggering data load for:", dateFilter);
        loadMeliData();
      } else {
        console.log("⚠️ Custom date range is incomplete. Skipping data fetch.");
      }
    }
  }, [dateFilter, customDateRange.fromISO, customDateRange.toISO, 
      meliConnected, session, meliUser, dataLoading, dataFetchAttempted, loadMeliData]);

  const calculatePercentChange = (current: number, previous: number): number => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
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

  return (
    <div className="min-h-screen bg-gofor-warmWhite font-poppins p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gofor-purple">Dashboard de Ventas</h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, {session?.user?.user_metadata?.first_name || 'Usuario'}
            </p>
          </div>
          
          {meliConnected && (
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
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

        {meliConnected && (
          <>
            {dataLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gofor-purple mr-2" />
                <span className="text-gofor-purple font-medium">Cargando datos de Mercado Libre...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <SummaryCard 
                    title="Balance Total"
                    value={formatCurrency(calculateBalance(salesSummary.gmv, salesSummary.commissions, salesSummary.shipping))}
                    percentChange={calculatePercentChange(
                      calculateBalance(salesSummary.gmv, salesSummary.commissions, salesSummary.shipping),
                      calculateBalance(prevSalesSummary.gmv, prevSalesSummary.commissions, prevSalesSummary.shipping)
                    )}
                    icon={<DollarSign className="h-5 w-5" />}
                  />
                  <SummaryCard 
                    title="GMV (Ventas totales)"
                    value={formatCurrency(salesSummary.gmv)}
                    percentChange={calculatePercentChange(salesSummary.gmv, prevSalesSummary.gmv)}
                    icon={<ShoppingBag className="h-5 w-5" />}
                  />
                  <SummaryCard 
                    title="Unidades vendidas"
                    value={formatNumber(salesSummary.units)}
                    percentChange={calculatePercentChange(salesSummary.units, prevSalesSummary.units)}
                    icon={<BarChart3 className="h-5 w-5" />}
                  />
                  <SummaryCard 
                    title="Ticket promedio"
                    value={formatCurrency(salesSummary.avgTicket)}
                    percentChange={calculatePercentChange(salesSummary.avgTicket, prevSalesSummary.avgTicket)}
                    icon={<CreditCard className="h-5 w-5" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <SummaryCard 
                    title="Visitas"
                    value={formatNumber(salesSummary.visits)}
                    percentChange={calculatePercentChange(salesSummary.visits, prevSalesSummary.visits)}
                    icon={<Users className="h-5 w-5" />}
                  />
                  <SummaryCard 
                    title="Tasa de conversión"
                    value={`${(Number(salesSummary.conversion) || 0).toFixed(1)}%`}
                    percentChange={calculatePercentChange(salesSummary.conversion, prevSalesSummary.conversion)}
                    icon={<Percent className="h-5 w-5" />}
                  />
                  <SummaryCard 
                    title="Comisiones totales"
                    value={formatCurrency(salesSummary.commissions)}
                    percentChange={calculatePercentChange(salesSummary.commissions, prevSalesSummary.commissions)}
                    icon={<DollarSign className="h-5 w-5" />}
                  />
                  <SummaryCard 
                    title="Costos de envío"
                    value={formatCurrency(salesSummary.shipping)}
                    percentChange={calculatePercentChange(salesSummary.shipping, prevSalesSummary.shipping)}
                    icon={<Truck className="h-5 w-5" />}
                  />
                </div>
                
                <Tabs defaultValue="ventas" className="mb-6">
                  <TabsList className="mb-6 bg-white border">
                    <TabsTrigger 
                      value="ventas" 
                      className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
                    >
                      Ventas
                    </TabsTrigger>
                    <TabsTrigger 
                      value="costos" 
                      className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
                    >
                      Costos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="productos" 
                      className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
                    >
                      Productos
                    </TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="ventas">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      <Card>
                        <CardHeader>
                          <CardTitle>Ventas por mes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={salesData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip 
                                  formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ventas']}
                                />
                                <Legend />
                                <Bar dataKey="value" name="Ventas ($)" fill="#663399" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Ventas por provincia</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={provinceData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {provinceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ventas']}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="costos">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                          <div className="text-2xl font-bold text-gofor-purple">{formatCurrency(salesSummary.commissions)}</div>
                          <div className="text-sm font-medium text-red-500">{((Number(salesSummary.commissions) / Math.max(Number(salesSummary.gmv), 1)) * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Impuestos</div>
                          <div className="text-2xl font-bold text-gofor-purple">{formatCurrency(salesSummary.taxes)}</div>
                          <div className="text-sm font-medium text-gray-500">{((Number(salesSummary.taxes) / Math.max(Number(salesSummary.gmv), 1)) * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Costos de envío</div>
                          <div className="text-2xl font-bold text-gofor-purple">{formatCurrency(salesSummary.shipping)}</div>
                          <div className="text-sm font-medium text-amber-500">{((Number(salesSummary.shipping) / Math.max(Number(salesSummary.gmv), 1)) * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="mb-8">
                      <CardHeader>
                        <CardTitle>Distribución de costos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={costData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {costData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Monto']}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="productos">
                    <Card>
                      <CardHeader>
                        <CardTitle>Productos más vendidos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-semibold">Producto</TableHead>
                                <TableHead className="text-right font-semibold">Unidades</TableHead>
                                <TableHead className="text-right font-semibold">Ingresos</TableHead>
                                <TableHead className="text-right font-semibold">% del Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-gray-50">
                                  <TableCell>{product.name}</TableCell>
                                  <TableCell className="text-right">{formatNumber(product.units)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                                  <TableCell className="text-right">
                                    {((Number(product.revenue) / Math.max(topProducts.reduce((sum, p) => sum + Number(p.revenue), 0), 1)) * 100).toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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
      />
    </div>
  );
};

export default Dashboard;
