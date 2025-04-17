
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Code, Webhook } from "lucide-react";

const ConfigurationGuide = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto bg-white">
      <CardHeader className="bg-gofor-purple text-white">
        <CardTitle className="text-xl font-poppins">Guía de Configuración</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="initial">
          <TabsList className="mb-6 bg-gray-100">
            <TabsTrigger value="initial">Primeros pasos</TabsTrigger>
            <TabsTrigger value="advanced">Configuración avanzada</TabsTrigger>
            <TabsTrigger value="troubleshooting">Solución de problemas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="initial">
            <div className="space-y-4">
              <Alert>
                <Info className="h-5 w-5" />
                <AlertTitle>Conexión con Mercado Libre</AlertTitle>
                <AlertDescription>
                  Para comenzar a utilizar el dashboard, primero debes conectar tu cuenta de Mercado Libre haciendo clic en el botón "Conectar con Mercado Libre".
                </AlertDescription>
              </Alert>
              
              <h3 className="text-lg font-medium mt-6">Datos disponibles</h3>
              <p className="text-gray-600">
                Una vez conectado, el dashboard mostrará automáticamente tus métricas de ventas, incluyendo:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-600">
                <li>Ventas totales (GMV)</li>
                <li>Unidades vendidas</li>
                <li>Ticket promedio</li>
                <li>Comisiones y costos</li>
                <li>Productos más vendidos</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-6">Filtros de fechas</h3>
              <p className="text-gray-600">
                Utiliza el selector de fechas en la parte superior derecha para filtrar los datos por diferentes períodos: hoy, ayer, últimos 7 días, últimos 30 días o un rango personalizado.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Webhooks y notificaciones</h3>
              <p className="text-gray-600">
                Para mantener tu dashboard actualizado en tiempo real, puedes configurar webhooks de Mercado Libre para recibir notificaciones cuando se produzcan nuevas ventas o cambios en tus productos.
              </p>
              
              <Alert className="bg-gray-50">
                <Webhook className="h-5 w-5" />
                <AlertTitle>URL del Webhook</AlertTitle>
                <AlertDescription className="font-mono bg-gray-100 p-2 mt-2 rounded">
                  https://melimetrics.app/api/webhook/mercadolibre
                </AlertDescription>
              </Alert>
              
              <h3 className="text-lg font-medium mt-6">Personalización</h3>
              <p className="text-gray-600">
                Próximamente: funciones para personalizar las métricas mostradas en el dashboard, exportar datos y más.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="troubleshooting">
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Problemas comunes</AlertTitle>
                <AlertDescription>
                  Si no puedes ver datos en el dashboard, verifica lo siguiente:
                </AlertDescription>
              </Alert>
              
              <ul className="list-disc pl-6 mt-4 text-gray-600">
                <li>Que tu cuenta de Mercado Libre esté correctamente conectada</li>
                <li>Que tengas ventas en el período seleccionado</li>
                <li>Que tu token de acceso no haya expirado (vuelve a conectar si es necesario)</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-6">Soporte</h3>
              <p className="text-gray-600">
                Si sigues teniendo problemas, contacta a nuestro soporte técnico en <span className="font-medium">soporte@gofor.ar</span>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConfigurationGuide;
