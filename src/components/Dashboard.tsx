import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c'];

// Sample data for the demo dashboard
const salesData = [{
  name: 'Ene',
  value: 12400
}, {
  name: 'Feb',
  value: 15600
}, {
  name: 'Mar',
  value: 14200
}, {
  name: 'Abr',
  value: 16800
}, {
  name: 'May',
  value: 18900
}, {
  name: 'Jun',
  value: 17300
}];
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
const Dashboard = () => {
  return <section id="dashboard" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tu Dashboard en acción</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Una vista previa de cómo Go For MeLi Metrics te ayuda a visualizar y analizar tu negocio
          </p>
        </div>
        
        <Tabs defaultValue="ventas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="ventas">Ventas</TabsTrigger>
            <TabsTrigger value="costos">Costos</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>
          
          
          
          <TabsContent value="costos" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
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
          
          <TabsContent value="productos" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
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
          </TabsContent>
        </Tabs>
      </div>
    </section>;
};
export default Dashboard;