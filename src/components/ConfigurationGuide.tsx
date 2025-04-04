
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Code, Webhook } from "lucide-react";

const ConfigurationGuide = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-medium text-[#663399]">Guía de Integración con Mercado Libre</CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="setup">
          <TabsList className="mb-4">
            <TabsTrigger value="setup">Configuración</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup">
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Autenticación</AlertTitle>
                <AlertDescription>
                  Para acceder a los datos de tu cuenta de Mercado Libre, necesitas autorizar la aplicación usando OAuth.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Pasos para la integración:</h4>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Conecta tu cuenta de Mercado Libre usando el botón "Conectar MeLi" en el dashboard</li>
                  <li>Autoriza los permisos necesarios en Mercado Libre</li>
                  <li>Una vez autorizada, los datos se cargarán automáticamente</li>
                  <li>Los tokens de acceso se actualizan automáticamente</li>
                </ol>
              </div>
              
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Nunca compartas tus credenciales de Mercado Libre con terceros. Esta aplicación utiliza OAuth para una autenticación segura sin almacenar tu contraseña.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="endpoints">
            <div className="space-y-4">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Endpoints utilizados:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Code className="h-5 w-5 mr-2 mt-0.5 text-[#663399]" />
                    <div>
                      <p className="font-medium">Órdenes de venta</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <code className="bg-gray-100 px-1 py-0.5 rounded">GET /orders/search</code>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Obtiene todas las órdenes completadas en un rango de fechas</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Code className="h-5 w-5 mr-2 mt-0.5 text-[#663399]" />
                    <div>
                      <p className="font-medium">Visitas</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <code className="bg-gray-100 px-1 py-0.5 rounded">GET /visits/items</code>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Métricas de visitas a los productos publicados</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Code className="h-5 w-5 mr-2 mt-0.5 text-[#663399]" />
                    <div>
                      <p className="font-medium">Facturación</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <code className="bg-gray-100 px-1 py-0.5 rounded">GET /billing/invoices</code>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Información de comisiones, impuestos y otros cargos</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics">
            <div className="space-y-4">
              <h4 className="font-medium mb-2">Métricas principales:</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-[#663399] text-white flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-xs font-bold">$</span>
                  </div>
                  <div>
                    <p className="font-medium">GMV (Gross Merchandise Value)</p>
                    <p className="text-sm text-gray-600">Valor total de todas las ventas realizadas</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-[#663399] text-white flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-xs font-bold">#</span>
                  </div>
                  <div>
                    <p className="font-medium">Unidades Vendidas</p>
                    <p className="text-sm text-gray-600">Cantidad total de productos vendidos</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-[#663399] text-white flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-xs font-bold">%</span>
                  </div>
                  <div>
                    <p className="font-medium">Tasa de Conversión (CR)</p>
                    <p className="text-sm text-gray-600">Porcentaje de visitas que se convierten en ventas</p>
                  </div>
                </li>
              </ul>
              
              <Alert className="mt-4 bg-blue-50">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700">Actualización de datos</AlertTitle>
                <AlertDescription className="text-blue-600">
                  Los datos se actualizan cada vez que cambias el filtro de fechas o recargas la página
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConfigurationGuide;
