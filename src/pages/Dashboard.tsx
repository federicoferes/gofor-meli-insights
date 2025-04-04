
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, ArrowDown, ArrowUp, Calendar as CalendarIcon, DollarSign, Package, ShoppingCart, TruckIcon, Users, BarChart3, Search, CircleDollarSign } from "lucide-react";
import { Loader2 } from "lucide-react";
import MeliConnect from '@/components/MeliConnect';
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ConfigurationGuide from '@/components/ConfigurationGuide';

const COLORS = ['#663399', '#FFD700', '#4CAF50', '#FF8042', '#9B59B6', '#3498DB'];

// Helper function to safely format numbers (handles undefined values)
const safeNumberFormat = (value, options = {}) => {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString('es-AR', options);
};

// Helper function to calculate and format percentage values safely
const safePercentage = (value, total) => {
  if (!value || !total || total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
};

// Helper function to format date ranges
const getDateRange = (filter) => {
  const today = new Date();
  let startDate = new Date();
  let label = '';
  
  switch(filter) {
    case 'today':
      startDate = startOfDay(today);
      label = 'Hoy';
      break;
    case 'yesterday':
      startDate = startOfDay(subDays(today, 1));
      label = 'Ayer';
      break;
    case '7d':
      startDate = startOfDay(subDays(today, 7));
      label = 'Últimos 7 días';
      break;
    case '30d':
      startDate = startOfDay(subDays(today, 30));
      label = 'Últimos 30 días';
      break;
    case 'custom':
      // Custom date handled separately
      label = 'Personalizado';
      break;
    default:
      startDate = startOfDay(subDays(today, 30));
      label = 'Últimos 30 días';
  }
  
  return {
    begin: startDate.toISOString(),
    end: endOfDay(today).toISOString(),
    label
  };
};

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meliConnected, setMeliConnected] = useState(false);
  const [meliUser, setMeliUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({ from: null, to: null });
  const [salesData, setSalesData] = useState([]);
  const [provinceSalesData, setProvinceSalesData] = useState([]);
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
    conversionRate: 0,
    previousPeriodGmv: 0,
    previousPeriodUnits: 0,
    previousPeriodTicket: 0,
    previousPeriodVisits: 0,
    previousPeriodConversion: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [costData, setCostData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast();

  // Effect to check session and MeLi connection
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

  // Effect to apply date filter changes
  useEffect(() => {
    if (dateFilter === 'custom' && (!customDateRange.from || !customDateRange.to)) {
      // Don't load data for incomplete custom range
      return;
    }
    
    if (meliConnected && session) {
      loadMeliData();
    }
  }, [dateFilter, customDateRange, meliConnected, session, meliUser]);

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
  };

  // Handle custom date range selection
  const handleCustomDateChange = (range) => {
    setCustomDateRange(range);
    if (range.from && range.to) {
      setIsDatePickerOpen(false);
    }
  };

  // Function to get the date range based on selected filter
  const getSelectedDateRange = () => {
    if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
      return {
        begin: startOfDay(customDateRange.from).toISOString(),
        end: endOfDay(customDateRange.to).toISOString(),
        label: `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`
      };
    }
    
    return getDateRange(dateFilter);
  };

  // Function to format growth indicator with up/down arrow
  const formatGrowth = (current, previous) => {
    if (!previous) return { value: 0, isPositive: true };
    
    const growth = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive: growth >= 0
    };
  };

  // Load Mercado Libre data
  const loadMeliData = async () => {
    if (!session || !meliConnected || !meliUser) {
      console.log("Skipping data load - not connected or no user ID", { session, meliConnected, meliUser });
      return;
    }
    
    try {
      setDataLoading(true);
      console.log("Loading MeLi data for user:", meliUser);
      
      // Get date range based on filter
      const dateRange = getSelectedDateRange();
      console.log("Date range:", dateRange);
      
      // Calculate previous period for comparison
      const currentPeriodDays = (new Date(dateRange.end) - new Date(dateRange.begin)) / (1000 * 60 * 60 * 24);
      const previousPeriodBegin = new Date(new Date(dateRange.begin).getTime() - currentPeriodDays * 24 * 60 * 60 * 1000).toISOString();
      const previousPeriodEnd = new Date(dateRange.begin).toISOString();
      
      // Create batch requests for all data we need
      const batchRequests = [
        // Current period orders
        {
          endpoint: '/orders/search',
          params: {
            seller: meliUser,
            order_status: 'paid',
            date_from: dateRange.begin,
            date_to: dateRange.end
          }
        },
        // Previous period orders (for comparison)
        {
          endpoint: '/orders/search',
          params: {
            seller: meliUser,
            order_status: 'paid',
            date_from: previousPeriodBegin,
            date_to: previousPeriodEnd
          }
        },
        // Items data for visits metrics
        {
          endpoint: `/users/${meliUser}/items/search`
        }
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
          setSalesSummary({
            ...salesSummary,
            ...batchData.dashboard_data.summary,
            // Add simulated previous period data for comparison (to be replaced with real data)
            previousPeriodGmv: batchData.dashboard_data.summary.gmv * 0.9,
            previousPeriodUnits: batchData.dashboard_data.summary.units * 0.92,
            previousPeriodTicket: batchData.dashboard_data.summary.avgTicket * 0.95,
            previousPeriodVisits: (batchData.dashboard_data.summary.visits || 5000) * 0.88,
            previousPeriodConversion: (batchData.dashboard_data.summary.conversionRate || 3.2) * 0.95
          });
        }
        
        // Set cost distribution
        if (batchData.dashboard_data.costDistribution?.length > 0) {
          setCostData(batchData.dashboard_data.costDistribution);
        }
        
        // Set top products
        if (batchData.dashboard_data.topProducts?.length > 0) {
          setTopProducts(batchData.dashboard_data.topProducts);
        }

        // Set province sales data (simulated)
        const provinces = [
          { name: 'Buenos Aires', value: 45 },
          { name: 'CABA', value: 25 },
          { name: 'Córdoba', value: 12 },
          { name: 'Santa Fe', value: 8 },
          { name: 'Mendoza', value: 5 },
          { name: 'Otras provincias', value: 5 }
        ];
        setProvinceSalesData(provinces);
      } else {
        console.log("No pre-processed dashboard data, using batch results directly");
        
        // Find the orders data in batch results
        const currentOrdersResult = batchData.batch_results.find(result => 
          result.endpoint.includes('/orders/search') && !result.endpoint.includes('previous') && result.success
        );
        
        const previousOrdersResult = batchData.batch_results.find(result => 
          result.endpoint.includes('/orders/search') && result.endpoint.includes('previous') && result.success
        );
        
        if (currentOrdersResult && currentOrdersResult.data.results) {
          const currentOrders = currentOrdersResult.data.results;
          const previousOrders = previousOrdersResult?.data?.results || [];
          
          console.log(`Processing ${currentOrders.length} current orders and ${previousOrders.length} previous orders`);
          
          // Process current period orders
          const currentGMV = currentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
          const currentUnits = currentOrders.reduce((sum, order) => {
            if (!order.order_items) return sum;
            return sum + order.order_items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
          }, 0);
          const currentAvgTicket = currentUnits > 0 ? currentGMV / currentUnits : 0;
          
          // Process previous period orders
          const previousGMV = previousOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
          const previousUnits = previousOrders.reduce((sum, order) => {
            if (!order.order_items) return sum;
            return sum + order.order_items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
          }, 0);
          const previousAvgTicket = previousUnits > 0 ? previousGMV / previousUnits : 0;
          
          // Simulate visits and conversion rate data
          const currentVisits = Math.max(currentUnits * 25, 1000);
          const previousVisits = Math.max(previousUnits * 25, 900);
          const currentConversion = (currentUnits / currentVisits) * 100;
          const previousConversion = (previousUnits / previousVisits) * 100;
          
          // Set summary data
          setSalesSummary({
            gmv: currentGMV,
            units: currentUnits,
            avgTicket: currentAvgTicket,
            visits: currentVisits,
            conversionRate: currentConversion,
            commissions: currentGMV * 0.07,
            taxes: currentGMV * 0.17,
            shipping: currentGMV * 0.03,
            discounts: currentGMV * 0.05,
            refunds: currentGMV * 0.02,
            iva: currentGMV * 0.21,
            previousPeriodGmv: previousGMV,
            previousPeriodUnits: previousUnits,
            previousPeriodTicket: previousAvgTicket,
            previousPeriodVisits: previousVisits,
            previousPeriodConversion: previousConversion
          });
          
          // Generate monthly sales data
          const monthlyData = [];
          const monthMap = new Map();
          
          currentOrders.forEach(order => {
            const date = new Date(order.date_created);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const monthName = format(date, 'MMM', { locale: es });
            
            if (monthMap.has(monthKey)) {
              monthMap.set(monthKey, {
                ...monthMap.get(monthKey),
                value: monthMap.get(monthKey).value + (order.total_amount || 0)
              });
            } else {
              monthMap.set(monthKey, {
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                value: order.total_amount || 0
              });
            }
          });
          
          // Convert map to array and sort by month
          Array.from(monthMap.entries()).forEach(([key, data]) => {
            monthlyData.push(data);
          });
          
          monthlyData.sort((a, b) => {
            const monthOrder = { 'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6, 
                               'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12 };
            return monthOrder[a.name] - monthOrder[b.name];
          });
          
          setSalesData(monthlyData);
          
          // Generate province sales data (simulated)
          const provinces = [
            { name: 'Buenos Aires', value: 45 },
            { name: 'CABA', value: 25 },
            { name: 'Córdoba', value: 12 },
            { name: 'Santa Fe', value: 8 },
            { name: 'Mendoza', value: 5 },
            { name: 'Otras provincias', value: 5 }
          ];
          setProvinceSalesData(provinces);
          
          // Set cost distribution
          setCostData([
            { name: 'Comisiones', value: currentGMV * 0.07 },
            { name: 'Impuestos', value: currentGMV * 0.17 },
            { name: 'Envíos', value: currentGMV * 0.03 },
            { name: 'Descuentos', value: currentGMV * 0.05 },
            { name: 'Anulaciones', value: currentGMV * 0.02 }
          ]);
          
          // Process top products
          const productMap = new Map();
          
          currentOrders.forEach(order => {
            if (!order.order_items) return;
            
            order.order_items.forEach(item => {
              const productId = item.item?.id;
              const productName = item.item?.title || 'Producto sin nombre';
              const quantity = item.quantity || 0;
              const unitPrice = item.unit_price || 0;
              const revenue = quantity * unitPrice;
              
              if (productId) {
                if (productMap.has(productId)) {
                  const current = productMap.get(productId);
                  productMap.set(productId, {
                    ...current,
                    units: current.units + quantity,
                    revenue: current.revenue + revenue
                  });
                } else {
                  productMap.set(productId, {
                    id: productId,
                    name: productName,
                    units: quantity,
                    revenue: revenue
                  });
                }
              }
            });
          });
          
          // Convert product map to array and sort by revenue
          const productArray = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
          
          setTopProducts(productArray);
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

  // Format growth indicators
  const gmvGrowth = formatGrowth(salesSummary.gmv, salesSummary.previousPeriodGmv);
  const unitsGrowth = formatGrowth(salesSummary.units, salesSummary.previousPeriodUnits);
  const ticketGrowth = formatGrowth(salesSummary.avgTicket, salesSummary.previousPeriodTicket);
  const visitsGrowth = formatGrowth(salesSummary.visits, salesSummary.previousPeriodVisits);
  const conversionGrowth = formatGrowth(salesSummary.conversionRate, salesSummary.previousPeriodConversion);

  const dateRange = getSelectedDateRange();

  return (
    <div className="min-h-screen bg-[#FAFFF6] p-4 md:p-6 font-[Poppins]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#663399]">Dashboard de Ventas</h1>
            <p className="text-gray-600 mt-2">
              {session?.user?.user_metadata?.first_name ? `Bienvenido, ${session.user.user_metadata.first_name}` : 'Bienvenido'}
            </p>
          </div>
          
          {meliConnected && (
            <div className="mt-4 md:mt-0 w-full md:w-auto flex items-center">
              <div className="flex items-center gap-2 bg-white border rounded-lg shadow-sm p-2 w-full md:w-auto">
                <CalendarIcon className="h-4 w-4 opacity-70" />
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-full md:w-[200px] border-0 focus:ring-0 px-0">
                    <SelectValue placeholder="Seleccionar periodo">
                      {dateFilter === 'custom' && customDateRange.from && customDateRange.to
                        ? `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`
                        : getDateRange(dateFilter).label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="yesterday">Ayer</SelectItem>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                
                {dateFilter === 'custom' && (
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 ml-1 p-0">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange.from || new Date()}
                        selected={{
                          from: customDateRange.from,
                          to: customDateRange.to,
                        }}
                        onSelect={handleCustomDateChange}
                        numberOfMonths={1}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="ml-2 hidden md:flex">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Configuración de la cuenta</SheetTitle>
                    <SheetDescription>
                      Configura tu integración con Mercado Libre
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <ConfigurationGuide />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
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
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-700">Datos de prueba</AlertTitle>
              <AlertDescription className="text-blue-600">
                Esta versión muestra datos de ejemplo para visualizar la interfaz. Los datos reales estarán disponibles una vez completada la integración.
              </AlertDescription>
            </Alert>

            {dataLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#663399] mr-2" />
                <span>Cargando datos de Mercado Libre...</span>
              </div>
            ) : (
              <>
                <Tabs defaultValue="ventas" className="mb-8">
                  <TabsList className="mb-6 bg-gray-100 p-1">
                    <TabsTrigger value="ventas" className="data-[state=active]:bg-[#663399] data-[state=active]:text-white">
                      Ventas
                    </TabsTrigger>
                    <TabsTrigger value="costos" className="data-[state=active]:bg-[#663399] data-[state=active]:text-white">
                      Costos
                    </TabsTrigger>
                    <TabsTrigger value="productos" className="data-[state=active]:bg-[#663399] data-[state=active]:text-white">
                      Productos
                    </TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="ventas">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {/* Balance Card */}
                      <Card className="bg-gradient-to-br from-[#663399] to-[#7c42b8] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-2">
                            <DollarSign className="h-6 w-6 opacity-80" />
                            <div className="text-xs opacity-80">Balance</div>
                          </div>
                          <div className="text-3xl font-bold">
                            ${safeNumberFormat(salesSummary.gmv - salesSummary.commissions - salesSummary.shipping)}
                          </div>
                          <div className="text-xs opacity-80 mt-1">Ventas menos comisiones y envíos</div>
                        </CardContent>
                      </Card>
                      
                      {/* GMV Card */}
                      <Card className="bg-[#1a1a1a] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-2">
                            <ShoppingCart className="h-6 w-6 opacity-80" />
                            <div className="text-xs opacity-80">GMV</div>
                          </div>
                          <div className="text-3xl font-bold">
                            ${safeNumberFormat(salesSummary.gmv)}
                          </div>
                          <div className="flex items-center mt-1 text-xs">
                            {gmvGrowth.isPositive ? 
                              <ArrowUp className="h-3 w-3 mr-1 text-green-400" /> : 
                              <ArrowDown className="h-3 w-3 mr-1 text-red-400" />
                            }
                            <span className={gmvGrowth.isPositive ? 'text-green-400' : 'text-red-400'}>
                              {gmvGrowth.value}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Units Card */}
                      <Card className="bg-[#1a1a1a] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-2">
                            <Package className="h-6 w-6 opacity-80" />
                            <div className="text-xs opacity-80">Unidades Vendidas</div>
                          </div>
                          <div className="text-3xl font-bold">
                            {safeNumberFormat(salesSummary.units)}
                          </div>
                          <div className="flex items-center mt-1 text-xs">
                            {unitsGrowth.isPositive ? 
                              <ArrowUp className="h-3 w-3 mr-1 text-green-400" /> : 
                              <ArrowDown className="h-3 w-3 mr-1 text-red-400" />
                            }
                            <span className={unitsGrowth.isPositive ? 'text-green-400' : 'text-red-400'}>
                              {unitsGrowth.value}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Average Ticket Card */}
                      <Card className="bg-[#1a1a1a] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-2">
                            <CircleDollarSign className="h-6 w-6 opacity-80" />
                            <div className="text-xs opacity-80">Tkt Promedio</div>
                          </div>
                          <div className="text-3xl font-bold">
                            ${safeNumberFormat(salesSummary.avgTicket)}
                          </div>
                          <div className="flex items-center mt-1 text-xs">
                            {ticketGrowth.isPositive ? 
                              <ArrowUp className="h-3 w-3 mr-1 text-green-400" /> : 
                              <ArrowDown className="h-3 w-3 mr-1 text-red-400" />
                            }
                            <span className={ticketGrowth.isPositive ? 'text-green-400' : 'text-red-400'}>
                              {ticketGrowth.value}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {/* Visits Card */}
                      <Card className="bg-[#1a1a1a] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-2">
                            <Users className="h-6 w-6 opacity-80" />
                            <div className="text-xs opacity-80">Visitas</div>
                          </div>
                          <div className="text-3xl font-bold">
                            {safeNumberFormat(salesSummary.visits)}
                          </div>
                          <div className="flex items-center mt-1 text-xs">
                            {visitsGrowth.isPositive ? 
                              <ArrowUp className="h-3 w-3 mr-1 text-green-400" /> : 
                              <ArrowDown className="h-3 w-3 mr-1 text-red-400" />
                            }
                            <span className={visitsGrowth.isPositive ? 'text-green-400' : 'text-red-400'}>
                              {visitsGrowth.value}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Conversion Rate Card */}
                      <Card className="bg-[#1a1a1a] text-white">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-2">
                            <BarChart3 className="h-6 w-6 opacity-80" />
                            <div className="text-xs opacity-80">CR</div>
                          </div>
                          <div className="text-3xl font-bold">
                            {safeNumberFormat(salesSummary.conversionRate, { maximumFractionDigits: 2 })}%
                          </div>
                          <div className="flex items-center mt-1 text-xs">
                            {conversionGrowth.isPositive ? 
                              <ArrowUp className="h-3 w-3 mr-1 text-green-400" /> : 
                              <ArrowDown className="h-3 w-3 mr-1 text-red-400" />
                            }
                            <span className={conversionGrowth.isPositive ? 'text-green-400' : 'text-red-400'}>
                              {conversionGrowth.value}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* Monthly Sales Chart */}
                      <Card className="overflow-hidden">
                        <CardHeader>
                          <CardTitle className="text-lg font-medium text-[#663399]">Venta mensual</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={salesData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                  dataKey="name" 
                                  tick={{ fontSize: 12 }} 
                                  tickLine={false}
                                />
                                <YAxis 
                                  tickFormatter={(value) => `$${value/1000}k`} 
                                  tick={{ fontSize: 12 }} 
                                  tickLine={false} 
                                  axisLine={false} 
                                />
                                <RechartsTooltip 
                                  formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ventas']}
                                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                                />
                                <Bar 
                                  dataKey="value" 
                                  name="Ventas" 
                                  fill="#663399" 
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Province Distribution Chart */}
                      <Card className="overflow-hidden">
                        <CardHeader>
                          <CardTitle className="text-lg font-medium text-[#663399]">Venta por provincia</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-72 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={provinceSalesData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {provinceSalesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value) => [`${value}%`, 'Porcentaje']}
                                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Top Products Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-medium text-[#663399]">Productos más vendidos</CardTitle>
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
                              {topProducts.map((product) => {
                                const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
                                const percentage = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
                                
                                return (
                                  <TableRow key={product.id} className="hover:bg-gray-50">
                                    <TableCell className="max-w-[200px] truncate">{product.name}</TableCell>
                                    <TableCell className="text-right">{safeNumberFormat(product.units)}</TableCell>
                                    <TableCell className="text-right">${safeNumberFormat(product.revenue)}</TableCell>
                                    <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="costos">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                          <div className="text-2xl font-bold text-[#663399]">${safeNumberFormat(salesSummary.commissions, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-sm font-medium text-red-500">{safePercentage(salesSummary.commissions, salesSummary.gmv)} del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Impuestos</div>
                          <div className="text-2xl font-bold text-[#663399]">${safeNumberFormat(salesSummary.taxes, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-sm font-medium text-gray-500">{safePercentage(salesSummary.taxes, salesSummary.gmv)} del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Costos de envío</div>
                          <div className="text-2xl font-bold text-[#663399]">${safeNumberFormat(salesSummary.shipping, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-sm font-medium text-amber-500">{safePercentage(salesSummary.shipping, salesSummary.gmv)} del GMV</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Descuentos</div>
                          <div className="text-2xl font-bold text-[#663399]">${safeNumberFormat(salesSummary.discounts, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-sm font-medium text-gray-500">{safePercentage(salesSummary.discounts, salesSummary.gmv)} del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">Anulaciones y reembolsos</div>
                          <div className="text-2xl font-bold text-[#663399]">${safeNumberFormat(salesSummary.refunds, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-sm font-medium text-gray-500">{safePercentage(salesSummary.refunds, salesSummary.gmv)} del GMV</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-gray-500 mb-1">IVA</div>
                          <div className="text-2xl font-bold text-[#663399]">${safeNumberFormat(salesSummary.iva, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-sm font-medium text-gray-500">{safePercentage(salesSummary.iva, salesSummary.gmv)} del GMV</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="mb-8">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium text-[#663399]">Distribución de costos</CardTitle>
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
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {costData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value) => [`$${safeNumberFormat(value)}`, 'Monto']}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="productos">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-medium text-[#663399]">Productos más vendidos</CardTitle>
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
                              {topProducts.map((product) => {
                                const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
                                const percentage = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
                                
                                return (
                                  <TableRow key={product.id} className="hover:bg-gray-50">
                                    <TableCell className="max-w-[200px] truncate">{product.name}</TableCell>
                                    <TableCell className="text-right">{safeNumberFormat(product.units)}</TableCell>
                                    <TableCell className="text-right">${safeNumberFormat(product.revenue)}</TableCell>
                                    <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                                  </TableRow>
                                );
                              })}
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
