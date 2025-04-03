
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  return (
    <section id="dashboard" className="py-20 bg-gray-50">
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
            <TabsTrigger value="margenes">Márgenes</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ventas" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
            <div className="aspect-video relative overflow-hidden rounded-lg border border-gray-200">
              <img 
                src="https://via.placeholder.com/1200x675?text=Dashboard+de+Ventas" 
                alt="Dashboard de Ventas" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Dashboard de Ventas</h3>
                  <p>Visualizá todas tus métricas de ventas en tiempo real con gráficos detallados.</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Ventas del mes</div>
                  <div className="text-2xl font-bold text-gofor-purple">$1,234,567</div>
                  <div className="text-sm font-medium text-green-500">+12.5% vs mes anterior</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Unidades vendidas</div>
                  <div className="text-2xl font-bold text-gofor-purple">823</div>
                  <div className="text-sm font-medium text-green-500">+8.7% vs mes anterior</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Ticket promedio</div>
                  <div className="text-2xl font-bold text-gofor-purple">$1,500</div>
                  <div className="text-sm font-medium text-green-500">+3.2% vs mes anterior</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="margenes" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
            <div className="aspect-video relative overflow-hidden rounded-lg border border-gray-200">
              <img 
                src="https://via.placeholder.com/1200x675?text=Dashboard+de+Márgenes" 
                alt="Dashboard de Márgenes" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Análisis de Márgenes</h3>
                  <p>Conocé la rentabilidad real de cada producto después de todos los costos.</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Margen bruto</div>
                  <div className="text-2xl font-bold text-gofor-purple">32.5%</div>
                  <div className="text-sm font-medium text-green-500">+2.1% vs mes anterior</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Margen neto</div>
                  <div className="text-2xl font-bold text-gofor-purple">18.3%</div>
                  <div className="text-sm font-medium text-green-500">+1.5% vs mes anterior</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Ganancia total</div>
                  <div className="text-2xl font-bold text-gofor-purple">$225,904</div>
                  <div className="text-sm font-medium text-green-500">+15.7% vs mes anterior</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="productos" className="bg-white rounded-xl shadow-lg p-4 md:p-8">
            <div className="aspect-video relative overflow-hidden rounded-lg border border-gray-200">
              <img 
                src="https://via.placeholder.com/1200x675?text=Ranking+de+Productos" 
                alt="Ranking de Productos" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Ranking de Productos</h3>
                  <p>Identificá fácilmente cuáles son tus productos estrella y más rentables.</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Producto más vendido</div>
                  <div className="text-xl font-bold text-gofor-purple truncate">Auriculares Inalámbricos</div>
                  <div className="text-sm font-medium text-gray-500">152 unidades</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Producto más rentable</div>
                  <div className="text-xl font-bold text-gofor-purple truncate">Parlante Bluetooth</div>
                  <div className="text-sm font-medium text-gray-500">Margen: 45.2%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Mayor crecimiento</div>
                  <div className="text-xl font-bold text-gofor-purple truncate">Cargador Rápido USB-C</div>
                  <div className="text-sm font-medium text-green-500">+67.3% vs mes anterior</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default Dashboard;
