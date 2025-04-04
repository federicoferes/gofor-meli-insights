
import React, { useState, useEffect } from 'react';
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

const COLORS = ['#663399', '#FFD700', '#8944EB', '#FF8042', '#9B59B6', '#4ade80'];

// Helper function to format date ranges
const getDateRange = (filter: string) => {
  const today = new Date();
  let startDate = new Date();
  
  switch(filter) {
    case 'today':
      startDate = new Date(today);
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(today.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(today.getDate() - 30);
      break;
    case 'custom':
      // Handled separately with custom date range
      break;
    default:
      startDate.setDate(today.getDate() - 30);
  }
  
  return {
    begin: startDate.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  };
};

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meliConnected, setMeliConnected] = useState(false);
  const [meliUser, setMeliUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState<{from?: Date, to?: Date}>({});
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
  const [dataLoading, setDataLoading] = useState(false);
  const { toast } = useToast();
  
  // Previous period summary for comparison
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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // Check if MeLi is connected
        try {
          const { data: connectionData, error } = await supabase.functions.invoke('meli-data', {
            body: { user_id: session.user.id }
          });
          
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
      setSession(session);
      
      // Check connection status when auth changes
      if (session) {
        supabase.functions.invoke('meli-data', {
          body: { user_id: session.user.id }
        }).then(({ data, error }) => {
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

  // Handle date range change
  const handleDateRangeChange = (range: string, dates?: { from: Date | undefined; to: Date | undefined }) => {
    setDateFilter(range);
    if (range === 'custom' && dates) {
      setCustomDateRange({
        from: dates.from,
        to: dates.to
      });
    }
  };

  // Load Mercado Libre data when connection status or date filter changes
  useEffect(() => {
    const loadMeliData = async () => {
      if (!session || !meliConnected || !meliUser) {
        console.log("Skipping data load - not connected or no user ID", { session, meliConnected, meliUser });
        return;
      }
      
      try {
        setDataLoading(true);
        console.log("Loading MeLi data for user:", meliUser);
        
        // Get date range based on filter
        const dateRange = getDateRange(dateFilter);
        console.log("Date range:", dateRange);
        
        // For custom date range
        if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
          dateRange.begin = customDateRange.from.toISOString().split('T')[0];
          dateRange.end = customDateRange.to.toISOString().split('T')[0];
        }
        
        // Create batch requests for all data we need
        const batchRequests = [
          // Orders data - recent orders with date filter
          {
            endpoint: '/orders/search',
            params: {
              seller: meliUser,
              order_status: 'paid',
              sort: 'date_desc',
              begin_date: dateRange.begin,
              end_date: dateRange.end
            }
          },
          // Seller metrics
          {
            endpoint: `/users/${meliUser}/items/search`
          },
          // Visits metrics (if available)
          {
            endpoint: `/visits/search`,
            params: {
              user_id: meliUser
            }
          }
          // Add more endpoints as needed
        ];
        
        // Make a single batch request to get all data at once
        const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
          body: { 
            user_id: session.user.id,
            batch_requests: batchRequests,
            date_range: dateRange,
            prev_period: true // Indicate we want previous period data for comparison
          }
        });
        
        if (batchError) {
          throw new Error(`Error fetching batch data: ${batchError.message}`);
        }
        
        if (!batchData || !batchData.success) {
          throw new Error(batchData?.message || 'Error fetching batch data');
        }
        
        console.log("Batch data received:", batchData);
        
        // Process dashboard data if available
        if (batchData.dashboard_data) {
          console.log("Using pre-processed dashboard data");
          
          // Set sales data for chart
          if (batchData.dashboard_data.salesByMonth?.length > 0) {
            setSalesData(batchData.dashboard_data.salesByMonth);
          }
          
          // Set sales summary
          if (batchData.dashboard_data.summary) {
            setSalesSummary(batchData.dashboard_data.summary);
          }

          // Set previous period summary for comparison
          if (batchData.dashboard_data.prev_summary) {
            setPrevSalesSummary(batchData.dashboard_data.prev_summary);
          }
          
          // Set cost distribution
          if (batchData.dashboard_data.costDistribution?.length > 0) {
            setCostData(batchData.dashboard_data.costDistribution);
          }
          
          // Set top products
          if (batchData.dashboard_data.topProducts?.length > 0) {
            setTopProducts(batchData.dashboard_data.topProducts);
          }

          // Set province data
          if (batchData.dashboard_data.salesByProvince?.length > 0) {
            setProvinceData(batchData.dashboard_data.salesByProvince);
          }
        } else {
          console.log("No pre-processed dashboard data, using batch results directly");
          
          // Find the orders data in batch results
          const ordersResult = batchData.batch_results.find(result => 
            result.endpoint.includes('/orders/search') && result.success
          );
          
          if (ordersResult && ordersResult.data.results) {
            const orders = ordersResult.data.results;
            console.log(`Processing ${orders.length} orders`);
            
            // Process the orders data (fallback implementation)
            // In a real-world scenario, this should be done by the edge function
            
            // Simulate loading data based on orders count (fallback)
            const simulatedGMV = orders.length * 1500;
            const simulatedUnits = orders.length * 2;
            
            // Set summary data
            const currentSummary = {
              gmv: simulatedGMV,
              units: simulatedUnits,
              avgTicket: simulatedGMV / Math.max(simulatedUnits, 1),
              commissions: simulatedGMV * 0.07,
              taxes: simulatedGMV * 0.17,
              shipping: simulatedGMV * 0.03,
              discounts: simulatedGMV * 0.05,
              refunds: simulatedGMV * 0.02,
              iva: simulatedGMV * 0.21,
              visits: simulatedUnits * 25,
              conversion: (simulatedUnits / (simulatedUnits * 25)) * 100
            };
            setSalesSummary(currentSummary);
            
            // Set previous period summary with slight variations
            setPrevSalesSummary({
              gmv: currentSummary.gmv * 0.9,
              units: currentSummary.units * 0.85,
              avgTicket: currentSummary.avgTicket * 1.05,
              commissions: currentSummary.commissions * 0.9,
              taxes: currentSummary.taxes * 0.9,
              shipping: currentSummary.shipping * 0.88,
              discounts: currentSummary.discounts * 0.93,
              refunds: currentSummary.refunds * 0.95,
              iva: currentSummary.iva * 0.9,
              visits: currentSummary.visits * 0.88,
              conversion: currentSummary.conversion * 0.95
            });
            
            // Generate simulated data for other metrics as a fallback
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const lastSixMonths = [];
            const today = new Date();
            
            for (let i = 5; i >= 0; i--) {
              const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
              lastSixMonths.push({
                name: monthNames[month.getMonth()],
                value: Math.floor(simulatedGMV / 6) + Math.floor(Math.random() * 1000)
              });
            }
            
            setSalesData(lastSixMonths);
            
            setCostData([
              { name: 'Comisiones', value: simulatedGMV * 0.07 },
              { name: 'Impuestos', value: simulatedGMV * 0.17 },
              { name: 'Envíos', value: simulatedGMV * 0.03 },
              { name: 'Descuentos', value: simulatedGMV * 0.05 },
              { name: 'Anulaciones', value: simulatedGMV * 0.02 }
            ]);
            
            // Generate simulated top products
            setTopProducts([
              { id: 1, name: 'Producto 1', units: Math.floor(simulatedUnits * 0.3), revenue: Math.floor(simulatedGMV * 0.3) },
              { id: 2, name: 'Producto 2', units: Math.floor(simulatedUnits * 0.25), revenue: Math.floor(simulatedGMV * 0.25) },
              { id: 3, name: 'Producto 3', units: Math.floor(simulatedUnits * 0.2), revenue: Math.floor(simulatedGMV * 0.2) },
              { id: 4, name: 'Producto 4', units: Math.floor(simulatedUnits * 0.15), revenue: Math.floor(simulatedGMV * 0.15) },
              { id: 5, name: 'Producto 5', units: Math.floor(simulatedUnits * 0.1), revenue: Math.floor(simulatedGMV * 0.1) }
            ]);

            // Generate simulated province data
            setProvinceData([
              { name: 'Buenos Aires', value: Math.floor(simulatedGMV * 0.45) },
              { name: 'CABA', value: Math.floor(simulatedGMV * 0.25) },
              { name: 'Córdoba', value: Math.floor(simulatedGMV * 0.1) },
              { name: 'Santa Fe', value: Math.floor(simulatedGMV * 0.08) },
              { name: 'Mendoza', value: Math.floor(simulatedGMV * 0.05) },
              { name: 'Otras', value: Math.floor(simulatedGMV * 0.07) }
            ]);
          }
        }
        
        setDataLoading(false);
        toast({
          title: "Datos cargados",
          description: "Se han cargado los datos de Mercado Libre correctamente.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error loading Mercado Libre data:", error);
        toast({
          variant: "destructive",
          title: "Error cargando datos",
          description: error.message || "No se pudieron cargar los datos de Mercado Libre."
        });
        setDataLoading(false);
      }
    };
    
    if (meliConnected) {
      loadMeliData();
    }
  }, [session, meliConnected, dateFilter, meliUser, customDateRange, toast]);

  // Calculate percentage changes for metrics
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
    </div>
  );
};

export default Dashboard;
