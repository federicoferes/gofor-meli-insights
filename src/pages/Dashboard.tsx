import React, { useState, useEffect, useRef } from 'react';
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
import { useMeliData } from '@/hooks/useMeliData';

const COLORS = ['#663399', '#FFD700', '#8944EB', '#FF8042', '#9B59B6', '#4ade80'];

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meliConnected, setMeliConnected] = useState(false);
  const [meliUser, setMeliUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date, 
    to?: Date,
    fromISO?: string,
    toISO?: string
  }>({});
  
  const { toast } = useToast();
  const isMounted = useRef(true);
  
  const {
    isLoading: dataLoading,
    salesData,
    salesSummary,
    topProducts,
    costData,
    provinceData,
    prevSalesSummary,
    refresh: refreshData
  } = useMeliData({
    userId: session?.user?.id,
    meliUserId: meliUser,
    dateFilter,
    dateRange: customDateRange,
    isConnected: meliConnected
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
                    isLoading={dataLoading}
                  />
                  <SummaryCard 
                    title="GMV (Ventas totales)"
                    value={formatCurrency(salesSummary.gmv)}
                    percentChange={calculatePercentChange(salesSummary.gmv, prevSalesSummary.gmv)}
                    icon={<ShoppingBag className="h-5 w-5" />}
                    isLoading={dataLoading}
                  />
                  <SummaryCard 
                    title="Unidades vendidas"
                    value={formatNumber(salesSummary.units)}
                    percentChange={calculatePercentChange(salesSummary.units, prevSalesSummary.units)}
                    icon={<BarChart3 className="h-5 w-5" />}
                    isLoading={dataLoading}
                  />
                  <SummaryCard 
                    title="Ticket promedio"
                    value={formatCurrency(salesSummary.avgTicket)}
                    percentChange={calculatePercentChange(salesSummary.avgTicket, prevSalesSummary.avgTicket)}
                    icon={<CreditCard className="h-5 w-5" />}
                    isLoading={dataLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <SummaryCard 
                    title="Visitas"
                    value={formatNumber(salesSummary.visits)}
                    percentChange={calculatePercentChange(salesSummary.visits, prevSalesSummary.visits)}
                    icon={<Users className="h-5 w-5" />}
                    isLoading={dataLoading}
                  />
                  <SummaryCard 
                    title="Tasa de conversión"
                    value={Number(salesSummary.conversion || 0).toFixed(1)}
                    suffix="%"
                    percentChange={calculatePercentChange(salesSummary.conversion, prevSalesSummary.conversion)}
                    icon={<Percent className="h-5 w-5" />}
                    isLoading={dataLoading}
                  />
                  <SummaryCard 
                    title="Comisiones totales"
                    value={formatCurrency(salesSummary.commissions)}
                    percentChange={calculatePercentChange(salesSummary.commissions, prevSalesSummary.commissions)}
                    icon={<DollarSign className="h-5 w-5" />}
                    isLoading={dataLoading}
                  />
                  <SummaryCard 
                    title="Costos de envío"
                    value={formatCurrency(salesSummary.shipping)}
                    percentChange={calculatePercentChange(salesSummary.shipping, prevSalesSummary.shipping)}
                    icon={<Truck className="h-5 w-5" />}
                    isLoading={dataLoading}
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
        onRefresh={refreshData}
      />
    </div>
  );
};

export default Dashboard;
