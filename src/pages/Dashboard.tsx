
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from "lucide-react";
import MeliConnect from '@/components/MeliConnect';

// Placeholder data - this would be replaced with real API data from MeLi
const salesData = [
  { name: 'Ene', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Abr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const topProducts = [
  { id: 1, name: 'Smartphone XYZ', units: 152, revenue: 45600 },
  { id: 2, name: 'Auriculares Bluetooth', units: 98, revenue: 29400 },
  { id: 3, name: 'Cargador Tipo C', units: 76, revenue: 15200 },
  { id: 4, name: 'Funda Protectora', units: 67, revenue: 6700 },
  { id: 5, name: 'Smartwatch Pro', units: 54, revenue: 32400 },
];

const costData = [
  { name: 'Comisión', value: 2500 },
  { name: 'Impuestos', value: 3500 },
  { name: 'Envío', value: 1500 },
  { name: 'Descuentos', value: 1000 },
  { name: 'Anulaciones', value: 800 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9B59B6'];

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meliConnected, setMeliConnected] = useState(false);
  const [dateFilter, setDateFilter] = useState('30d');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
      
      // Check if MeLi is connected (this would be based on your actual implementation)
      // For now, we'll assume it's not connected
      setMeliConnected(false);
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

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

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Resumen de ventas</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Periodo:</span>
            <Select defaultValue={dateFilter} onValueChange={setDateFilter}>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Ventas totales (GMV)</div>
              <div className="text-2xl font-bold text-gofor-purple">$84,254.89</div>
              <div className="text-sm font-medium text-green-500">+8.2% vs periodo anterior</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Comisiones</div>
              <div className="text-2xl font-bold text-gofor-purple">$5,890.32</div>
              <div className="text-sm font-medium text-red-500">7% del GMV</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Impuestos</div>
              <div className="text-2xl font-bold text-gofor-purple">$14,323.33</div>
              <div className="text-sm font-medium text-gray-500">17% del GMV</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Costos de envío</div>
              <div className="text-2xl font-bold text-gofor-purple">$2,527.65</div>
              <div className="text-sm font-medium text-amber-500">3% del GMV</div>
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
                    <Tooltip />
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
                    <Tooltip />
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
                      <td className="p-3 text-right">${product.revenue.toLocaleString()}</td>
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
      </div>
    </div>
  );
};

export default Dashboard;
