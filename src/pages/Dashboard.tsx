
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, DollarSign, ShoppingBag, CreditCard, Users, BarChart3, Percent, Truck, Calculator, PieChart as PieChartIcon, Megaphone, Package } from "lucide-react";
import MeliConnect from '@/components/MeliConnect';
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DateRangePicker from '@/components/DateRangePicker';
import SummaryCard from '@/components/SummaryCard';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { Alert, AlertDescription } from "@/components/ui/alert";
import DebugButton from '@/components/DebugButton';
import { useMeliData } from '@/hooks/useMeliData';
import { useProducts } from '@/hooks/useProducts';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ProductsTable from '@/components/ProductsTable';

const COLORS = ['#663399', '#FFD700', '#8944EB', '#FF8042', '#9B59B6', '#4ade80'];

const calculateBalance = (gmv: number, commissions: number, shipping: number, taxes: number, ivaRate: number, advertising: number = 0, productCosts: number = 0) => {
  const iva = (gmv * ivaRate) / 100;
  return gmv - commissions - shipping - taxes - iva - advertising - productCosts;
};

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
    isTestData, // Extraemos isTestData del hook useMeliData
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

  const calculatePercentChange = (current: number, previous: number): number => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
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
    salesSummary.gmv, 
    salesSummary.commissions, 
    salesSummary.shipping, 
    salesSummary.taxes, 
    ivaRate,
    salesSummary.advertising || 0,
    salesSummary.productCosts || 0
  );

  const previousBalance = calculateBalance(
    prevSalesSummary.gmv, 
    prevSalesSummary.commissions, 
    prevSalesSummary.shipping, 
    prevSalesSummary.taxes, 
    ivaRate,
    prevSalesSummary.advertising || 0,
    prevSalesSummary.productCosts || 0
  );

  const currentIva = (salesSummary.gmv * ivaRate) / 100;
  const previousIva = (prevSalesSummary.gmv * ivaRate) / 100;

  const advertisingGmvPercent = salesSummary.gmv > 0 && salesSummary.advertising > 0
    ? ((salesSummary.advertising / salesSummary.gmv) * 100).toFixed(1)
    : null;

  const productCostsGmvPercent = salesSummary.gmv > 0 && salesSummary.productCosts > 0
    ? ((salesSummary.productCosts / salesSummary.gmv) * 100).toFixed(1)
    : null;

  const costDistributionData = [
    { name: 'Comisiones', value: salesSummary.commissions },
    { name: 'Impuestos', value: salesSummary.taxes },
    { name: 'Envíos', value: salesSummary.shipping },
    { name: 'IVA', value: currentIva },
    ...(salesSummary.advertising > 0 ? [{ name: 'Publicidad', value: salesSummary.advertising }] : []),
    ...(salesSummary.productCosts > 0 ? [{ name: 'Costo de productos', value: salesSummary.productCosts }] : [])
  ];

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
                  <div className="lg:col-span-2">
                    <SummaryCard 
                      title={
                        <div className="flex items-center justify-between">
                          <span>Balance Total</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <Calculator className="h-4 w-4 text-gray-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium mb-2">Configuración de tasa IVA</h4>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    value={ivaRate}
                                    onChange={handleIvaRateChange}
                                    className="w-20"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                  />
                                  <span>%</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  La tasa de IVA se usa para calcular el balance total:
                                  GMV - comisiones - envíos - impuestos - IVA({ivaRate}% del GMV) - publicidad - costo productos
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      }
                      value={formatCurrency(currentBalance)}
                      percentChange={calculatePercentChange(currentBalance, previousBalance)}
                      icon={<DollarSign className="h-5 w-5" />}
                      isLoading={dataLoading}
                      colorClass="bg-gradient-to-r from-gofor-purple/10 to-gofor-purple/5"
                      tooltip="Balance calculado como GMV - comisiones - envíos - impuestos - IVA - publicidad - costos de productos"
                      isTestData={isTestData}
                    />
                  </div>
                  <SummaryCard 
                    title="GMV (Ventas totales)"
                    value={formatCurrency(salesSummary.gmv)}
                    percentChange={calculatePercentChange(salesSummary.gmv, prevSalesSummary.gmv)}
                    icon={<ShoppingBag className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="Calculado como la suma de precio unitario * cantidad de todos los items vendidos"
                    isTestData={isTestData}
                  />
                  <SummaryCard 
                    title="Unidades vendidas"
                    value={formatNumber(salesSummary.units)}
                    percentChange={calculatePercentChange(salesSummary.units, prevSalesSummary.units)}
                    icon={<BarChart3 className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="Total de unidades (quantity) vendidas en todas las órdenes"
                    isTestData={isTestData}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <SummaryCard 
                    title="Ticket promedio"
                    value={formatCurrency(salesSummary.avgTicket)}
                    percentChange={calculatePercentChange(salesSummary.avgTicket, prevSalesSummary.avgTicket)}
                    icon={<CreditCard className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="GMV / Número de órdenes"
                    isTestData={isTestData}
                  />
                  <SummaryCard 
                    title="Visitas"
                    value={formatNumber(salesSummary.visits)}
                    percentChange={calculatePercentChange(salesSummary.visits, prevSalesSummary.visits)}
                    icon={<Users className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="Suma de visitas a productos publicados desde /visits/items"
                    isTestData={isTestData}
                  />
                  <SummaryCard 
                    title="Tasa de conversión"
                    value={Number(salesSummary.conversion || 0).toFixed(1)}
                    suffix="%"
                    percentChange={calculatePercentChange(salesSummary.conversion, prevSalesSummary.conversion)}
                    icon={<Percent className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="(Unidades vendidas / Visitas) * 100"
                    isTestData={isTestData}
                  />
                  <SummaryCard 
                    title="IVA (aplicado)"
                    value={formatCurrency(currentIva)}
                    percentChange={calculatePercentChange(currentIva, previousIva)}
                    icon={<DollarSign className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip={`GMV * ${ivaRate}% (configurable)`}
                    isTestData={isTestData}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <SummaryCard 
                    title="Comisiones totales"
                    value={formatCurrency(salesSummary.commissions)}
                    percentChange={calculatePercentChange(salesSummary.commissions, prevSalesSummary.commissions)}
                    icon={<DollarSign className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="Suma de fee_details[].amount de todas las órdenes"
                    isTestData={isTestData}
                  />
                  <SummaryCard 
                    title="Costos de envío"
                    value={formatCurrency(salesSummary.shipping)}
                    percentChange={calculatePercentChange(salesSummary.shipping, prevSalesSummary.shipping)}
                    icon={<Truck className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="Suma de shipping.shipping_option.cost de todas las órdenes"
                    isTestData={isTestData}
                  />
                  <SummaryCard 
                    title="Impuestos"
                    value={formatCurrency(salesSummary.taxes)}
                    percentChange={calculatePercentChange(salesSummary.taxes, prevSalesSummary.taxes)}
                    icon={<DollarSign className="h-5 w-5" />}
                    isLoading={dataLoading}
                    tooltip="Suma de taxes[].amount en órdenes"
                    isTestData={isTestData}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <SummaryCard 
                    title="Gastos de Publicidad"
                    value={formatCurrency(salesSummary.advertising || 0)}
                    percentChange={calculatePercentChange(
                      salesSummary.advertising || 0, 
                      prevSalesSummary.advertising || 0
                    )}
                    icon={<Megaphone className="h-5 w-5" />}
                    isLoading={dataLoading}
                    additionalInfo={advertisingGmvPercent ? `${advertisingGmvPercent}% del GMV` : null}
                    tooltip="Gastos de campañas desde /ads/campaigns (0 si no hay datos)"
                    isTestData={isTestData}
                  />
                  <SummaryCard 
                    title="Costo de Productos Vendidos"
                    value={formatCurrency(salesSummary.productCosts || 0)}
                    percentChange={calculatePercentChange(
                      salesSummary.productCosts || 0, 
                      prevSalesSummary.productCosts || 0
                    )}
                    icon={<Package className="h-5 w-5" />}
                    isLoading={dataLoading}
                    additionalInfo={productCostsGmvPercent ? `${productCostsGmvPercent}% del GMV` : null}
                    tooltip="Suma del costo registrado * cantidad vendida de cada producto"
                    isTestData={isTestData}
                  />
                </div>
                
                <Tabs 
                  defaultValue="ventas" 
                  className="mb-6"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
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
                      Productos Vendidos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="inventario" 
                      className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
                    >
                      Inventario
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
                          <div className="text-sm text-gray-500 mb-1">IVA ({ivaRate}%)</div>
                          <div className="text-2xl font-bold text-gofor-purple">{formatCurrency(currentIva)}</div>
                          <div className="text-sm font-medium text-amber-500">{ivaRate}% del GMV</div>
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
                                data={costDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {costDistributionData.map((entry, index) => (
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
                  
                  <TabsContent value="inventario">
                    <ProductsTable 
                      products={products}
                      isLoading={productsLoading}
                      onRefresh={fetchProducts}
                      onUpdateCost={updateProductCost}
                    />
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
