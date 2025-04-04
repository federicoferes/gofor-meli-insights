
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Code, Webhook } from "lucide-react";

const ConfigurationGuide = () => {
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied({...copied, [key]: true});
    
    setTimeout(() => {
      setCopied({...copied, [key]: false});
    }, 2000);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-gofor-purple">
          Guía de Configuración para Mercado Libre API
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="endpoints">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="endpoints">Endpoints API</TabsTrigger>
            <TabsTrigger value="configuration">Configuración</TabsTrigger>
            <TabsTrigger value="code">Código de Ejemplo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="endpoints" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-5 w-5" />
              <AlertTitle>Endpoints principales de Mercado Libre</AlertTitle>
              <AlertDescription className="mt-2">
                A continuación se muestran los principales endpoints que se utilizan para obtener datos de ventas.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">💰 GMV (Ventas Totales) y Cantidad de Ventas</h3>
                <div className="flex items-start gap-2">
                  <code className="text-sm bg-slate-100 p-2 rounded flex-1 overflow-auto">
                    /orders/search?seller={`{SELLER_ID}`}&order_status=paid&date_from=YYYY-MM-DDTHH:MM:SS.000Z&date_to=YYYY-MM-DDTHH:MM:SS.000Z
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`/orders/search?seller={SELLER_ID}&order_status=paid&date_from=YYYY-MM-DDTHH:MM:SS.000Z&date_to=YYYY-MM-DDTHH:MM:SS.000Z`, 'gmv')}
                    className="text-xs bg-gofor-purple text-white px-2 py-1 rounded hover:bg-opacity-90"
                  >
                    {copied['gmv'] ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Suma <code>total_amount</code> de cada orden para GMV.
                  Suma <code>order_items[].quantity</code> para unidades vendidas.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">💳 Ticket Promedio</h3>
                <p className="text-sm text-slate-600">Cálculo personalizado:</p>
                <code className="text-sm bg-slate-100 p-2 rounded mt-1 block">
                  ticketPromedio = GMV / cantidadDeVentas;
                </code>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">👁️ Visitas a Publicaciones</h3>
                <div className="flex items-start gap-2">
                  <code className="text-sm bg-slate-100 p-2 rounded flex-1 overflow-auto">
                    /visits/items?ids={`{ITEM_IDs}`}&date_from=YYYY-MM-DDTHH:MM:SS.000Z&date_to=YYYY-MM-DDTHH:MM:SS.000Z
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`/visits/items?ids={ITEM_IDs}&date_from=YYYY-MM-DDTHH:MM:SS.000Z&date_to=YYYY-MM-DDTHH:MM:SS.000Z`, 'visits')}
                    className="text-xs bg-gofor-purple text-white px-2 py-1 rounded hover:bg-opacity-90"
                  >
                    {copied['visits'] ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Suma la cantidad total de visitas a tus publicaciones.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">🔁 Tasa de Conversión</h3>
                <p className="text-sm text-slate-600">Cálculo personalizado:</p>
                <code className="text-sm bg-slate-100 p-2 rounded mt-1 block">
                  tasaConversion = (cantidadDeVentas / cantidadDeVisitas) * 100;
                </code>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">🧾 Comisiones</h3>
                <div className="flex items-start gap-2">
                  <code className="text-sm bg-slate-100 p-2 rounded flex-1 overflow-auto">
                    /billing/invoices
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`/billing/invoices`, 'commissions')}
                    className="text-xs bg-gofor-purple text-white px-2 py-1 rounded hover:bg-opacity-90"
                  >
                    {copied['commissions'] ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Necesitas obtener todos los movimientos del vendedor y filtrar por tipo "comisión".
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Alternativa: <code>/orders/{`{ORDER_ID}`}/payments</code> y revisar <code>fee_amount</code>.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">🚚 Costo de Envíos</h3>
                <div className="flex items-start gap-2">
                  <code className="text-sm bg-slate-100 p-2 rounded flex-1 overflow-auto">
                    /shipments/{`{shipment_id}`}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`/shipments/{shipment_id}`, 'shipping')}
                    className="text-xs bg-gofor-purple text-white px-2 py-1 rounded hover:bg-opacity-90"
                  >
                    {copied['shipping'] ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Usás: <code>shipping_option.cost</code>, <code>shipping_option.list_cost</code>, <code>shipping_option.base_cost</code>
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">🗺️ Distribución de Ventas por Provincia</h3>
                <p className="text-sm text-slate-600">
                  Desde las órdenes, accedés a: <code>order.buyer.shipping_address.state.name</code>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Agrupás por <code>state.name</code> para ver la distribución geográfica.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="configuration" className="space-y-4 mt-4">
            <Alert>
              <Webhook className="h-5 w-5" />
              <AlertTitle>Configuración necesaria en Mercado Libre</AlertTitle>
              <AlertDescription className="mt-2">
                Para recibir notificaciones en tiempo real y autorizar tu aplicación.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">URLs de Redirección OAuth</h3>
                <div className="flex items-start gap-2">
                  <code className="text-sm bg-slate-100 p-2 rounded flex-1">
                    https://melimetrics.app/oauth/callback
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`https://melimetrics.app/oauth/callback`, 'redirect')}
                    className="text-xs bg-gofor-purple text-white px-2 py-1 rounded hover:bg-opacity-90"
                  >
                    {copied['redirect'] ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Esta URL se utiliza cuando un usuario autoriza tu aplicación.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">URL de Notificaciones</h3>
                <div className="flex items-start gap-2">
                  <code className="text-sm bg-slate-100 p-2 rounded flex-1">
                    https://melimetrics.app/api/meli-notifications
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`https://melimetrics.app/api/meli-notifications`, 'notification')}
                    className="text-xs bg-gofor-purple text-white px-2 py-1 rounded hover:bg-opacity-90"
                  >
                    {copied['notification'] ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Esta URL recibe notificaciones cuando ocurren eventos como nuevas ventas, preguntas, etc.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="font-semibold mb-1 text-gofor-purple">Tópicos de Notificaciones</h3>
                <ul className="list-disc list-inside text-sm text-slate-600">
                  <li><code>orders_v2</code> - Para recibir notificaciones de órdenes</li>
                  <li><code>items</code> - Para cambios en tus productos</li>
                  <li><code>questions</code> - Para preguntas de compradores</li>
                  <li><code>messages</code> - Para mensajes en el chat de la compra</li>
                  <li><code>shipments</code> - Para actualizaciones de envíos</li>
                </ul>
              </div>
              
              <Alert variant="warning" className="mt-4">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>¡Importante!</AlertTitle>
                <AlertDescription>
                  Recuerda que necesitas tener un servidor activo para recibir las notificaciones. Nuestra función edge de Supabase está configurada para procesarlas.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="space-y-4 mt-4">
            <Alert>
              <Code className="h-5 w-5" />
              <AlertTitle>Código de ejemplo para obtener datos</AlertTitle>
              <AlertDescription className="mt-2">
                Estos ejemplos te muestran cómo obtener los diferentes tipos de datos desde el frontend.
              </AlertDescription>
            </Alert>
            
            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="font-semibold mb-1 text-gofor-purple">Obtener Ventas</h3>
              <pre className="text-sm bg-slate-100 p-3 rounded overflow-auto mt-2">
                {`const { data } = await supabase.functions.invoke('meli-data', {
  body: { 
    user_id: session.user.id,
    endpoint: '/orders/search',
    params: {
      seller: meliUser,
      order_status: 'paid',
      date_from: '2023-01-01T00:00:00.000Z',
      date_to: '2023-12-31T23:59:59.999Z'
    }
  }
});

// Calcular GMV
let gmv = 0;
let units = 0;

if (data?.success) {
  data.data.results.forEach(order => {
    gmv += order.total_amount || 0;
    order.order_items?.forEach(item => {
      units += item.quantity || 0;
    });
  });
}

// Calcular ticket promedio
const avgTicket = orders.length > 0 ? gmv / orders.length : 0;`}
              </pre>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="font-semibold mb-1 text-gofor-purple">Obtener Visitas</h3>
              <pre className="text-sm bg-slate-100 p-3 rounded overflow-auto mt-2">
                {`// Primero obtener los IDs de tus items
const { data: itemsData } = await supabase.functions.invoke('meli-data', {
  body: { 
    user_id: session.user.id,
    endpoint: \`/users/\${meliUser}/items/search\`
  }
});

if (itemsData?.success && itemsData.data.results) {
  const itemIds = itemsData.data.results.join(',');
  
  // Luego obtener visitas para esos items
  const { data: visitsData } = await supabase.functions.invoke('meli-data', {
    body: { 
      user_id: session.user.id,
      endpoint: '/visits/items',
      params: {
        ids: itemIds,
        date_from: '2023-01-01T00:00:00.000Z',
        date_to: '2023-12-31T23:59:59.999Z'
      }
    }
  });
  
  // Calcular total de visitas
  let totalVisits = 0;
  if (visitsData?.success) {
    Object.values(visitsData.data).forEach(item => {
      totalVisits += item.total_visits || 0;
    });
  }
  
  // Calcular tasa de conversión
  const conversionRate = totalVisits > 0 ? (orders.length / totalVisits) * 100 : 0;
}`}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConfigurationGuide;
