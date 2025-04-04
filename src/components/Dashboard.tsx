import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowUp, CircleDollarSign, TrendingUp, ShoppingCart, Users, PieChart as PieChartIcon, TrendingDown, ArrowDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COLORS = ['#663399', '#9b87f5', '#FFD700', '#ff8042', '#8dd1e1', '#a4de6c'];

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

const provinceData = [
  { name: 'Buenos Aires', value: 42 },
  { name: 'CABA', value: 28 },
  { name: 'Córdoba', value: 15 },
  { name: 'Santa Fe', value: 10 },
  { name: 'Mendoza', value: 5 }
];

const Dashboard = () => {
  return (
    <section id="dashboard" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#663399]">Tu Dashboard en acción</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Una vista previa de cómo Go For MeLi Metrics te ayuda a visualizar y analizar tu negocio
          </p>
          
          <div className="flex justify-end my-4">
            <div className="bg-white rounded-lg shadow p-2 flex items-center space-x-2">
              <span className="text-sm font-medium">Período:</span>
              <select className="text-sm border-none bg-transparent focus:ring-0 focus:outline-none">
                <option>Hoy</option>
                <option>Ayer</option>
                <option>Últimos 7 días</option>
                <option selected>Últimos 30 días</option>
                <option>Personalizado</option>
              </select>
            </div>
          </div>
        </div>
        
        <Alert variant="warning" className="mb-8">
          <AlertDescription className="flex items-center">
            <span className="font-medium">Esto es una demostración con datos de muestra.</span> Conecta tu cuenta de Mercado Libre para ver tu información real.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="ventas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="ventas">Ventas</TabsTrigger>
            <TabsTrigger value="costos">Costos</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ventas" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs opacity-80 mb-1">GMV Mensual</div>
                      <div className="text-2xl font-bold">$1,234,567</div>
                    </div>
                    <CircleDollarSign className="h-8 w-8 opacity-70" />
                  </div>
                  <div className="text-xs font-medium mt-3 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    <span>+15.3% vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs opacity-80 mb-1">Órdenes</div>
                      <div className="text-2xl font-bold">4,856</div>
                    </div>
                    <ShoppingCart className="h-8 w-8 opacity-70" />
                  </div>
                  <div className="text-xs font-medium mt-3 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    <span>+8.7% vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs opacity-80 mb-1">Ticket Promedio</div>
                      <div className="text-2xl font-bold">$254.23</div>
                    </div>
                    <TrendingUp className="h-8 w-8 opacity-70" />
                  </div>
                  <div className="text-xs font-medium mt-3 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    <span>+5.2% vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#663399] to-[#9b87f5] text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs opacity-80 mb-1">Visitas</div>
                      <div className="text-2xl font-bold">24,879</div>
                    </div>
                    <Users className="h-8 w-8 opacity-70" />
                  </div>
                  <div className="text-xs font-medium mt-3 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    <span>+12.6% vs mes anterior</span>
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
                      <div className="text-2xl font-bold text-[#663399]">4.2%</div>
                    </div>
                    <div className="bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs flex items-center">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>+0.3%</span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#663399] to-[#9b87f5]" style={{width: '4.2%'}}></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Meta: 5.0%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                      <div className="text-2xl font-bold text-[#663399]">$86,419</div>
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
                  <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#663399" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#663399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'GMV']} />
                    <Area type="monotone" dataKey="GMV" stroke="#663399" fillOpacity={1} fill="url(#colorGMV)" />
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
                      <Tooltip />
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
                    <Tooltip formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ventas']} />
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
                  <div className="text-2xl font-bold text-[#663399]">$86,419</div>
                  <div className="text-sm font-medium text-gray-500">7% del GMV</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Impuestos</div>
                  <div className="text-2xl font-bold text-[#663399]">$209,876</div>
                  <div className="text-sm font-medium text-gray-500">17% del GMV</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Envíos</div>
                  <div className="text-2xl font-bold text-[#663399]">$37,037</div>
                  <div className="text-sm font-medium text-gray-500">3% del GMV</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Descuentos</div>
                  <div className="text-2xl font-bold text-[#663399]">$61,728</div>
                  <div className="text-sm font-medium text-gray-500">5% del GMV</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Anulaciones</div>
                  <div className="text-2xl font-bold text-[#663399]">$24,691</div>
                  <div className="text-sm font-medium text-gray-500">2% del GMV</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">IVA</div>
                  <div className="text-2xl font-bold text-[#663399]">$259,259</div>
                  <div className="text-sm font-medium text-gray-500">21% del GMV</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="productos" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
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
      </div>
    </section>
  );
};

export default Dashboard;
