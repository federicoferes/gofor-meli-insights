import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from "lucide-react";
import MeliConnect from '@/components/MeliConnect';
import { useToast } from "@/components/ui/use-toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9B59B6'];

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
  const [dateFilter, setDateFilter] = useState('7d');
  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    gmv: 0,
    commissions: 0,
    taxes: 0,
    shipping: 0,
    discounts: 0,
    refunds: 0,
    iva: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [costData, setCostData] = useState([]);
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
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Load Mercado Libre data when connection status or date filter changes
  useEffect(() => {
    const loadMeliData = async () => {
      if (!session || !meliConnected) return;
      
      try {
        setDataLoading(true);
        
        // Get date range based on filter
        const dateRange = getDateRange(dateFilter);
        
        // Fetch orders data
        const { data: ordersData, error: ordersError } = await supabase.functions.invoke('meli-data', {
          body: { 
            user_id: session.user.id,
            endpoint: '/orders/search',
            params: {
              seller: meliUser,
              order_status: 'paid',
              sort: 'date_desc',
              begin_date: dateRange.begin,
              end_date: dateRange.end
            }
          }
        });
        
        if (ordersError) {
          throw new Error(`Error fetching orders: ${ordersError.message}`);
        }
        
        if (!ordersData.success) {
          throw new Error(ordersData.message || 'Error fetching orders');
        }
        
        // Process orders data
        const orders = ordersData.data.results || [];
        console.log("Orders data from Mercado Libre:", orders);
        
        // In a real implementation, we would process the orders to extract:
        // - Monthly sales for the chart
        // - Total GMV
        // - Commissions, taxes, shipping costs
        // - Top selling products
        
        // For demo purposes, we're using placeholder data
        // In a real implementation, we would calculate these from the orders data
        
        // Simulate loading data
        setTimeout(() => {
          // Sales data for chart (would be calculated from orders)
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const lastSixMonths = [];
          const today = new Date();
          
          for (let i = 5; i >= 0; i--) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            lastSixMonths.push(monthNames[month.getMonth()]);
          }
          
          const simulatedSalesData = lastSixMonths.map(name => ({
            name,
            value: Math.floor(Math.random() * 5000 + 2000)
          }));
          
          // Sales summary
          const gmv = simulatedSalesData.reduce((sum, month) => sum + month.value, 0);
          const commissions = gmv * 0.07;
          const taxes = gmv * 0.17;
          const shipping = gmv * 0.03;
          const discounts = gmv * 0.05;
          const refunds = gmv * 0.02;
          const iva = gmv * 0.21;
          
          // Cost data for pie chart
          const simulatedCostData = [
            { name: 'Comisión', value: commissions },
            { name: 'Impuestos', value: taxes },
            { name: 'Envío', value: shipping },
            { name: 'Descuentos', value: discounts },
            { name: 'Anulaciones', value: refunds }
          ];
          
          // Top products (would be calculated from orders)
          const simulatedTopProducts = [
            { id: 1, name: 'Smartphone XYZ', units: 152, revenue: 45600 },
            { id: 2, name: 'Auriculares Bluetooth', units: 98, revenue: 29400 },
            { id: 3, name: 'Cargador Tipo C', units: 76, revenue: 15200 },
            { id: 4, name: 'Funda Protectora', units: 67, revenue: 6700 },
            { id: 5, name: 'Smartwatch Pro', units: 54, revenue: 32400 },
          ];
          
          setSalesData(simulatedSalesData);
          setSalesSummary({
            gmv,
            commissions,
            taxes,
            shipping,
            discounts,
            refunds,
            iva
          });
          setCostData(simulatedCostData);
          setTopProducts(simulatedTopProducts);
          setDataLoading(false);
        }, 1000);
        
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
        <Loader2 className="h-8 w-8 animate-spin text-gofor-purple" />
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
          <h1 className="text-3xl font-bold">Dashboard de Ventas</h1>
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
              <h2 className="text-xl font-semibold">Resumen de ventas</h2>
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
                <Loader2 className="h-8 w-8 animate-spin text-gofor-purple mr-2" />
                <span>Cargando datos de Mercado Libre...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Ventas totales (GMV)</div>
                      <div className="text-2xl font-bold text-gofor-purple">${salesSummary.gmv.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-sm font-medium text-green-500">+8.2% vs periodo anterior</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                      <div className="text-2xl font-bold text-gofor-purple">${salesSummary.commissions.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-sm font-medium text-red-500">{(salesSummary.commissions / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Impuestos</div>
                      <div className="text-2xl font-bold text-gofor-purple">${salesSummary.taxes.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-sm font-medium text-gray-500">{(salesSummary.taxes / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Costos de envío</div>
                      <div className="text-2xl font-bold text-gofor-purple">${salesSummary.shipping.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-sm font-medium text-amber-500">{(salesSummary.shipping / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Descuentos</div>
                      <div className="text-2xl font-bold text-gofor-purple">${salesSummary.discounts.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-sm font-medium text-gray-500">{(salesSummary.discounts / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Anulaciones y reembolsos</div>
                      <div className="text-2xl font-bold text-gofor-purple">${salesSummary.refunds.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-sm font-medium text-gray-500">{(salesSummary.refunds / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">IVA</div>
                      <div className="text-2xl font-bold text-gofor-purple">${salesSummary.iva.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-sm font-medium text-gray-500">{(salesSummary.iva / salesSummary.gmv * 100).toFixed(1)}% del GMV</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ventas mensuales</CardTitle>
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
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="value" name="Ventas ($)" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
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
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {costData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Productos más vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="p-3 font-semibold text-gray-600">Producto</th>
                            <th className="p-3 font-semibold text-gray-600 text-right">Unidades</th>
                            <th className="p-3 font-semibold text-gray-600 text-right">Ingresos</th>
                            <th className="p-3 font-semibold text-gray-600 text-right">% del Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProducts.map((product) => (
                            <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-3">{product.name}</td>
                              <td className="p-3 text-right">{product.units}</td>
                              <td className="p-3 text-right">${product.revenue.toLocaleString('es-AR')}</td>
                              <td className="p-3 text-right">
                                {(product.revenue / topProducts.reduce((sum, p) => sum + p.revenue, 0) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
