
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Loader2, ArrowUp, CircleDollarSign, ShoppingCart, TrendingUp, Users, PieChart as PieChartIcon, TrendingDown, ArrowDown } from "lucide-react";
import MeliConnect from '@/components/MeliConnect';
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COLORS = ['#663399', '#9b87f5', '#FFD700', '#ff8042', '#8dd1e1', '#a4de6c'];

// Helper function to format date ranges
const getDateRange = (filter) => {
  const today = new Date();
  let startDate = new Date();
  
  switch(filter) {
    case '7d':
      startDate.setDate(today.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(today.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(today.getDate() - 90);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
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
    conversionRate: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [costData, setCostData] = useState([]);
  const [provinceData, setProvinceData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const { toast } = useToast();

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
          // Item visit data
          {
            endpoint: '/visits/items',
            params: {
              ids: 'ALL_ITEMS', // This would be replaced with actual item IDs in the edge function
              date_from: dateRange.begin,
              date_to: dateRange.end
            }
          },
          // Seller metrics
          {
            endpoint: `/users/${meliUser}/items/search`
          }
          // Add more endpoints as needed
        ];
        
        // Make a single batch request to get all data at once
        const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
          body: { 
            user_id: session.user.id,
            batch_requests: batchRequests
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
          
          // Set cost distribution
          if (batchData.dashboard_data.costDistribution?.length > 0) {
            setCostData(batchData.dashboard_data.costDistribution);
          }
          
          // Set top products
          if (batchData.dashboard_data.topProducts?.length > 0) {
            setTopProducts(batchData.dashboard_data.topProducts);
          }

          // Set province data
          if (batchData.dashboard_data.provinceDistribution?.length > 0) {
            setProvinceData(batchData.dashboard_data.provinceDistribution);
          }
        } else {
          console.log("No pre-processed dashboard data, using batch results directly");
          
          // Find the orders data in batch results
          const ordersResult = batchData.batch_results.find(result => 
            result.endpoint.includes('/orders/search') && result.success
          );
          
          const visitsResult = batchData.batch_results.find(result => 
            result.endpoint.includes('/visits/items') && result.success
          );
          
          if (ordersResult && ordersResult.data.results) {
            const orders = ordersResult.data.results;
            console.log(`Processing ${orders.length} orders`);
            
            // Process the orders data (fallback implementation)
            // In a real-world scenario, this should be done by the edge function
            
            // Simulate loading data based on orders count (fallback)
            const simulatedGMV = orders.length * 1500;
            const simulatedUnits = orders.length * 2;
            const simulatedVisits = visitsResult ? 
              (visitsResult.data.total_visits || orders.length * 20) : 
              orders.length * 20;
            
            // Set summary data
            setSalesSummary({
              gmv: simulatedGMV,
              units: simulatedUnits,
              avgTicket: simulatedGMV / orders.length,
              commissions: simulatedGMV * 0.07,
              taxes: simulatedGMV * 0.17,
              shipping: simulatedGMV * 0.03,
              discounts: simulatedGMV * 0.05,
              refunds: simulatedGMV * 0.02,
              iva: simulatedGMV * 0.21,
              visits: simulatedVisits,
              conversionRate: (orders.length / simulatedVisits) * 100
            });
            
            // Generate simulated data for other metrics as a fallback
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const lastSixMonths = [];
            const today = new Date();
            
            for (let i = 5; i >= 0; i--) {
              const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
              lastSixMonths.push({
                name: monthNames[month.getMonth()],
                value: Math.floor(simulatedGMV / 6) + Math.floor(Math.random() * 1000),
                prevValue: Math.floor((simulatedGMV / 6) * 0.85) + Math.floor(Math.random() * 800)
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
              { name: 'Buenos Aires', value: 42 },
              { name: 'CABA', value: 28 },
              { name: 'Córdoba', value: 15 },
              { name: 'Santa Fe', value: 10 },
              { name: 'Mendoza', value: 5 }
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
  }, [session, meliConnected, dateFilter, meliUser, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#663399]" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#663399]">Dashboard de Ventas</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido, {session?.user?.user_metadata?.first_name || 'Usuario'}
          </p>
        </header>

        {!meliConnected ? (
          <Card className="mb-8 bg-amber-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-amber-800">Conecta tu cuenta de Mercado Libre</h3>
                  <p className="text-amber-700">Para ver tus métricas de ventas, necesitas conectar tu cuenta de Mercado Libre.</p>
                </div>
                <MeliConnect />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {meliConnected && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#663399]">Resumen de ventas</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Periodo:</span>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                    <SelectItem value="year">Este año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dataLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#663399] mr-2" />
                <span>Cargando datos de Mercado Libre...</span>
              </div>
            ) : (
              <>
                <Alert variant="warning" className="mb-8">
                  <AlertDescription className="flex items-center">
                    <span className="font-medium">Esto es una demostración con datos de muestra.</span> Conecta tu cuenta de Mercado Libre para ver tu información real.
                  </AlertDescription>
                </Alert>

                <Tabs defaultValue="ventas">
                  <TabsList className="mb-6">
                    <TabsTrigger value="ventas">Ventas</TabsTrigger>
                    <TabsTrigger value="costos">Costos</TabsTrigger>
                    <TabsTrigger value="productos">Productos</TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="ventas">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs opacity-80 mb-1">GMV Mensual</div>
                              <div className="text-2xl font-bold">${salesSummary.gmv.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                            </div>
                            <CircleDollarSign className="h-8 w-8 opacity-70" />
                          </div>
                          <div className="text-xs font-medium mt-3 flex items-center">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            <span>+8.2% vs periodo anterior</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs opacity-80 mb-1">Órdenes</div>
                              <div className="text-2xl font-bold">{salesSummary.units.toLocaleString('es-AR')}</div>
                            </div>
                            <ShoppingCart className="h-8 w-8 opacity-70" />
                          </div>
                          <div className="text-xs font-medium mt-3 flex items-center">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            <span>+6.7% vs periodo anterior</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs opacity-80 mb-1">Ticket Promedio</div>
                              <div className="text-2xl font-bold">${salesSummary.avgTicket.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                            </div>
                            <TrendingUp className="h-8 w-8 opacity-70" />
                          </div>
                          <div className="text-xs font-medium mt-3 flex items-center">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            <span>+1.5% vs periodo anterior</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs opacity-80 mb-1">Visitas</div>
                              <div className="text-2xl font-bold">{salesSummary.visits.toLocaleString('es-AR')}</div>
                            </div>
                            <Users className="h-8 w-8 opacity-70" />
                          </div>
                          <div className="text-xs font-medium mt-3 flex items-center">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            <span>+12.6% vs periodo anterior</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Tasa de Conversión</div>
                              <div className="text-2xl font-bold text-[#663399]">{salesSummary.conversionRate.toFixed(1)}%</div>
                            </div>
                            <div className="bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs flex items-center">
                              <ArrowUp className="w-3 h-3 mr-1" />
                              <span>+0.3%</span>
                            </div>
                          </div>
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#663399] to-[#9b87f5]" style={{width: `${salesSummary.conversionRate}%`}}></div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Meta: 5.0%</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                              <div className="text-2xl font-bold text-[#663399]">${salesSummary.commissions.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                            </div>
                            <div className="bg-red-100 text-red-800 rounded-full px-2 py-1 text-xs flex items-center">
                              <ArrowUp className="w-3 h-3 mr-1" />
                              <span>+2.1%</span>
                            </div>
                          </div>
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400" style={{width: '7%'}}></div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">7.0% del GMV</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4 text-[#663399]">Evolución de Ventas</h3>
                      <div className="h-80 bg-white p-4 rounded-lg border border-gray-100">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#663399" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#663399" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'GMV']} />
                            <Area type="monotone" dataKey="value" stroke="#663399" fillOpacity={1} fill="url(#colorGMV)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-[#663399]">Productos más vendidos</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Unidades</TableHead>
                              <TableHead className="text-right">Ingresos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topProducts.slice(0, 4).map(product => <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right">{product.units}</TableCell>
                                <TableCell className="text-right">${product.revenue.toLocaleString('es-AR')}</TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-[#663399]">Distribución por provincia</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={provinceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {provinceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4 text-[#663399]">Ventas por mes</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={salesData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ventas']} />
                            <Bar dataKey="value" name="Ventas" fill="#663399" />
                            <Bar dataKey="prevValue" name="Período anterior" fill="#DBC8FF" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="costos" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-4 text-[#663399]">Distribución de Costos</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={costData} cx="50%" cy="50%" labelLine={false} label={({
                            name,
                            percent
                          }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                              {costData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <RechartsTooltip formatter={value => [`$${value.toLocaleString('es-AR')}`, 'Monto']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                          <div className="text-2xl font-bold text-[#663399]">${salesSummary.commissions.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                          <div className="text-sm font-medium text-gray-500">{(salesSummary.commissions / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 mb-1">Impuestos</div>
                          <div className="text-2xl font-bold text-[#663399]">${salesSummary.taxes.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                          <div className="text-sm font-medium text-gray-500">{(salesSummary.taxes / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 mb-1">Envíos</div>
                          <div className="text-2xl font-bold text-[#663399]">${salesSummary.shipping.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                          <div className="text-sm font-medium text-gray-500">{(salesSummary.shipping / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 mb-1">Descuentos</div>
                          <div className="text-2xl font-bold text-[#663399]">${salesSummary.discounts.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                          <div className="text-sm font-medium text-gray-500">{(salesSummary.discounts / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 mb-1">Anulaciones</div>
                          <div className="text-2xl font-bold text-[#663399]">${salesSummary.refunds.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                          <div className="text-sm font-medium text-gray-500">{(salesSummary.refunds / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 mb-1">IVA</div>
                          <div className="text-2xl font-bold text-[#663399]">${salesSummary.iva.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                          <div className="text-sm font-medium text-gray-500">{(salesSummary.iva / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="productos" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-[#663399]">Productos más vendidos</h3>
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
                              <TableCell className="text-right">{product.units}</TableCell>
                              <TableCell className="text-right">${product.revenue.toLocaleString('es-AR')}</TableCell>
                              <TableCell className="text-right">
                                {(product.revenue / topProducts.reduce((sum, p) => sum + p.revenue, 0) * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4 text-[#663399]">Estado del Inventario</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'En stock', value: 85, color: '#4ade80' },
                                { name: 'Stock bajo', value: 10, color: '#facc15' },
                                { name: 'Sin stock', value: 5, color: '#f87171' },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {[
                                { name: 'En stock', value: 85, color: '#4ade80' },
                                { name: 'Stock bajo', value: 10, color: '#facc15' },
                                { name: 'Sin stock', value: 5, color: '#f87171' },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4 text-[#663399]">Productos por Categoría</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Electrónica', activos: 45, pausados: 8, finalizados: 12 },
                              { name: 'Hogar', activos: 32, pausados: 5, finalizados: 7 },
                              { name: 'Indumentaria', activos: 28, pausados: 4, finalizados: 6 },
                              { name: 'Juguetes', activos: 15, pausados: 3, finalizados: 2 },
                              { name: 'Otros', activos: 10, pausados: 2, finalizados: 3 }
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="activos" stackId="a" fill="#4ade80" />
                            <Bar dataKey="pausados" stackId="a" fill="#facc15" />
                            <Bar dataKey="finalizados" stackId="a" fill="#f87171" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
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

