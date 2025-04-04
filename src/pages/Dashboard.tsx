import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import MeliConnect from '@/components/MeliConnect';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c'];

// Sample data for the demo dashboard
const salesData = [{
  name: 'Ene',
  value: 12400,
  prevValue: 10200
}, {
  name: 'Feb',
  value: 15600,
  prevValue: 12300
}, {
  name: 'Mar',
  value: 14200,
  prevValue: 13100
}, {
  name: 'Abr',
  value: 16800,
  prevValue: 14500
}, {
  name: 'May',
  value: 18900,
  prevValue: 15700
}, {
  name: 'Jun',
  value: 17300,
  prevValue: 16400
}];

const performanceData = [
  { name: 'Ene', GMV: 1200000, Orders: 2400, Conversion: 3.2 },
  { name: 'Feb', GMV: 1350000, Orders: 2100, Conversion: 2.9 },
  { name: 'Mar', GMV: 1800000, Orders: 2800, Conversion: 3.4 },
  { name: 'Abr', GMV: 2200000, Orders: 3500, Conversion: 3.8 },
  { name: 'May', GMV: 2800000, Orders: 4200, Conversion: 4.1 },
  { name: 'Jun', GMV: 3100000, Orders: 4800, Conversion: 4.5 },
];

const costDistributionData = [{
  name: 'Comisiones',
  value: 12500
}, {
  name: 'Impuestos',
  value: 25600
}, {
  name: 'Envíos',
  value: 8500
}, {
  name: 'Descuentos',
  value: 7800
}, {
  name: 'Anulaciones',
  value: 3600
}];

const topProducts = [{
  id: 1,
  name: 'Smartphone XYZ',
  units: 152,
  revenue: 45600
}, {
  id: 2,
  name: 'Auriculares Bluetooth',
  units: 98,
  revenue: 29400
}, {
  id: 3,
  name: 'Cargador Tipo C',
  units: 76,
  revenue: 15200
}, {
  id: 4,
  name: 'Funda Protectora',
  units: 67,
  revenue: 6700
}, {
  id: 5,
  name: 'Smartwatch Pro',
  units: 54,
  revenue: 32400
}];

const inventoryData = [
  { name: 'En stock', value: 85, color: '#4ade80' },
  { name: 'Stock bajo', value: 10, color: '#facc15' },
  { name: 'Sin stock', value: 5, color: '#f87171' },
];

// Helper function to safely format numbers
const safeNumberFormat = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to safely format percentages
const safePercentFormat = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(value / 100);
};

// Define dashboard data types
interface SalesSummary {
  gmv: number;
  units: number;
  avgTicket: number;
  visits: number;
  conversion: number;
  commissions: number;
  taxes: number;
  shipping: number;
  discounts: number;
  refunds: number;
  iva: number;
}

interface DashboardData {
  summary: SalesSummary;
  salesByMonth: { key: string; name: string; value: number }[];
  costDistribution: { name: string; value: number }[];
  topProducts: { id: number; name: string; units: number; revenue: number }[];
}

const Dashboard = () => {
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    const checkMeliConnection = async () => {
      const { data } = await supabase.auth.getSession();
        
      if (data.session?.user) {
        try {
          const { data: connectionData, error } = await supabase.functions.invoke('meli-data', {
            body: { user_id: data.session.user.id }
          });
          
          if (!error && connectionData?.is_connected) {
            setIsConnected(true);
            fetchDashboardData(dateRange?.from, dateRange?.to);
          } else {
            setIsConnected(false);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error checking MeLi connection:", error);
          setIsConnected(false);
          setIsLoading(false);
        }
      } else {
        setIsConnected(false);
        setIsLoading(false);
      }
    };

    checkMeliConnection();
  }, []);

  const fetchDashboardData = async (startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');

        const { data: dashboardData, error } = await supabase.functions.invoke('meli-data', {
          body: {
            user_id: data.session.user.id,
            batch_requests: [
              {
                endpoint: '/orders/search',
                method: 'GET',
                params: {
                  seller: data.session.user.user_metadata.meli_user_id,
                  order_filters: '["date_created_from","date_created_to"]',
                  date_created_from: startDateStr,
                  date_created_to: endDateStr,
                  limit: 100
                }
              }
            ]
          }
        });

        if (error) {
          console.error("Error fetching dashboard data:", error);
        } else if (dashboardData?.dashboard_data) {
          setSalesSummary(dashboardData.dashboard_data.summary);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe calculation for balance
  const calculateBalance = (summary: SalesSummary | null): number => {
    if (!summary) return 0;
    const gmv = Number(summary.gmv) || 0;
    const commissions = Number(summary.commissions) || 0;
    const shipping = Number(summary.shipping) || 0;
    return gmv - commissions - shipping;
  };

  return (
    <section id="dashboard" className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isConnected ? (
          <div className="text-center my-20 p-8 bg-white rounded-xl shadow-lg max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Conecta tu cuenta de Mercado Libre</h2>
            <p className="text-gray-600 mb-6">
              Para ver tu dashboard de ventas, necesitás conectar tu cuenta de Mercado Libre.
            </p>
            <MeliConnect />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Dashboard de Ventas</h2>
              
              <div className="flex items-center space-x-2">
                {/* Date range selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-[240px]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        <span>Seleccionar período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        if (range?.from && range?.to) {
                          fetchDashboardData(range.from, range.to);
                        }
                      }}
                      numberOfMonths={2}
                    />
                    <div className="flex justify-end gap-2 p-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateRange({
                            from: subDays(today, 30),
                            to: today
                          });
                          fetchDashboardData(subDays(today, 30), today);
                        }}
                      >
                        Últimos 30 días
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateRange({
                            from: subDays(today, 7),
                            to: today
                          });
                          fetchDashboardData(subDays(today, 7), today);
                        }}
                      >
                        Últimos 7 días
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (dateRange?.from && dateRange?.to) {
                      fetchDashboardData(dateRange.from, dateRange.to);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7l3-3"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-15 6.7l-3 3"></path>
                  </svg>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white border-l-4 border-[#663399]">
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Balance</div>
                  <div className="text-2xl font-bold">
                    {isLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      safeNumberFormat(calculateBalance(salesSummary))
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Ventas - Comisiones - Envíos</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-l-4 border-green-500">
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">GMV</div>
                  <div className="text-2xl font-bold">
                    {isLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      safeNumberFormat(salesSummary?.gmv)
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Ventas Totales</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-l-4 border-blue-500">
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Unidades</div>
                  <div className="text-2xl font-bold">
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      salesSummary?.units.toLocaleString('es-AR') || 0
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Productos vendidos</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-l-4 border-amber-500">
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Ticket Promedio</div>
                  <div className="text-2xl font-bold">
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      safeNumberFormat(salesSummary?.avgTicket)
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">GMV / Unidades</div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="ventas" className="w-full bg-white rounded-xl shadow-sm p-4">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="ventas">Ventas</TabsTrigger>
                <TabsTrigger value="costos">Costos</TabsTrigger>
                <TabsTrigger value="productos">Productos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ventas" className="mt-4">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Evolución de Ventas</h3>
                  <div className="h-80 bg-white p-4 rounded-lg border border-gray-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'GMV']} />
                        <Area type="monotone" dataKey="GMV" stroke="#8884d8" fillOpacity={1} fill="url(#colorGMV)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Categorías más vendidas</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Electrónica', value: 38 },
                              { name: 'Hogar', value: 25 },
                              { name: 'Indumentaria', value: 18 },
                              { name: 'Juguetes', value: 10 },
                              { name: 'Otros', value: 9 }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-4">Medios de pago</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Tarjeta de crédito', value: 45 },
                            { name: 'Mercado Pago', value: 32 },
                            { name: 'Tarjeta de débito', value: 15 },
                            { name: 'Efectivo', value: 8 }
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="costos" className="mt-4">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">Distribución de Costos</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={costDistributionData} cx="50%" cy="50%" labelLine={false} label={({
                        name,
                        percent
                      }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                        {costDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={value => [`$${value.toLocaleString('es-AR')}`, 'Monto']} />
                      <Legend />
                    </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                      <div className="text-2xl font-bold text-gofor-purple">$86,419</div>
                      <div className="text-sm font-medium text-gray-500">7% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500 mb-1">Impuestos</div>
                      <div className="text-2xl font-bold text-gofor-purple">$209,876</div>
                      <div className="text-sm font-medium text-gray-500">17% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500 mb-1">Envíos</div>
                      <div className="text-2xl font-bold text-gofor-purple">$37,037</div>
                      <div className="text-sm font-medium text-gray-500">3% del GMV</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500 mb-1">Descuentos</div>
                      <div className="text-2xl font-bold text-gofor-purple">$61,728</div>
                      <div className="text-sm font-medium text-gray-500">5% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500 mb-1">Anulaciones</div>
                      <div className="text-2xl font-bold text-gofor-purple">$24,691</div>
                      <div className="text-sm font-medium text-gray-500">2% del GMV</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500 mb-1">IVA</div>
                      <div className="text-2xl font-bold text-gofor-purple">$259,259</div>
                      <div className="text-sm font-medium text-gray-500">21% del GMV</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="productos" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-4">Productos Más Vendidos</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Unidades</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                          <TableHead className="text-right">% del Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map(product => <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">{product.units}</TableCell>
                            <TableCell className="text-right">${product.revenue.toLocaleString('es-AR')}</TableCell>
                            <TableCell className="text-right">
                              {(product.revenue / topProducts.reduce((sum, p) => sum + p.revenue, 0) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-4">Estado del Inventario</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={inventoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {inventoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-4">Productos por Categoría</h3>
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
                        <Tooltip />
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
      </div>
    </section>
  );
};

export default Dashboard;
