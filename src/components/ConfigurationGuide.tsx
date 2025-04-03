
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Code, Webhook } from "lucide-react";

const ConfigurationGuide = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Documentación Técnica</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Guía completa para la integración con Mercado Libre y configuración de la aplicación
          </p>
        </div>
        
        <Tabs defaultValue="oauth" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="oauth">OAuth2 Flow</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="oauth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-gofor-purple" />
                  Flujo OAuth2 con Mercado Libre
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  La integración con Mercado Libre utiliza el protocolo estándar OAuth2 para autenticar usuarios y obtener acceso a sus datos de forma segura.
                </p>
                
                <h3 className="text-lg font-semibold mt-4">Paso a paso del flujo OAuth2:</h3>
                
                <ol className="list-decimal ml-5 space-y-2">
                  <li>
                    <strong>Autenticación del usuario:</strong> El usuario hace clic en "Conectar con Mercado Libre" y es redirigido al Authorization URL de Mercado Libre.
                  </li>
                  <li>
                    <strong>Autorización del usuario:</strong> El usuario inicia sesión en Mercado Libre y autoriza a la aplicación para acceder a su cuenta.
                  </li>
                  <li>
                    <strong>Redirección al sitio:</strong> Mercado Libre redirige automáticamente al usuario al redirect_uri configurado, con un code temporal incluido en la URL.
                  </li>
                  <li>
                    <strong>Intercambio del code:</strong> El backend de la app toma ese code y lo intercambia por un access_token y un refresh_token.
                  </li>
                  <li>
                    <strong>Acceso a la cuenta del usuario:</strong> Con el access_token, la app puede acceder a la información de la cuenta del usuario.
                  </li>
                </ol>
                
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Importante</AlertTitle>
                  <AlertDescription>
                    Es fundamental guardar el refresh_token para mantener el acceso a la cuenta del usuario sin necesidad de volver a autorizarse.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-100 p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">URL de Authorization:</h4>
                  <code className="text-sm bg-gray-200 p-1 rounded">
                    https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI
                  </code>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-md">
                  <h4 className="font-medium mb-2">URL para obtener Access Token:</h4>
                  <code className="text-sm bg-gray-200 p-1 rounded">
                    https://api.mercadolibre.com/oauth/token
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-gofor-purple" />
                  Configuración de API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Para integrar correctamente la aplicación con Mercado Libre, necesitás configurar las siguientes credenciales en el archivo de variables de entorno:
                </p>
                
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atención</AlertTitle>
                  <AlertDescription>
                    Estas credenciales son sensibles y no deben compartirse públicamente. Utilizá Supabase para mantenerlas seguras.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-100 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Credenciales necesarias:</h4>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>
                      <code className="text-sm bg-gray-200 p-1 rounded">VITE_MELI_APP_ID</code>: Tu ID de aplicación de Mercado Libre
                    </li>
                    <li>
                      <code className="text-sm bg-gray-200 p-1 rounded">MELI_CLIENT_SECRET</code>: El Client Secret de tu aplicación en Mercado Libre (Almacenado en Supabase)
                    </li>
                  </ul>
                </div>
                
                <h3 className="text-lg font-semibold mt-4">Configuración en Supabase:</h3>
                <p>
                  Los secretos sensibles como MELI_CLIENT_SECRET deben configurarse en Supabase para mantenerlos seguros.
                </p>
                
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Accedé al dashboard de Supabase.</li>
                  <li>Navegá a la sección Settings > Database > Functions & Secrets.</li>
                  <li>Agregá las variables MELI_CLIENT_SECRET y cualquier otra clave sensible.</li>
                </ol>
                
                <div className="bg-gray-100 p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">Acceso seguro a las credenciales:</h4>
                  <p className="text-sm">
                    Para utilizar estos secretos en funciones de Supabase, podés accederlos desde el objeto <code>Deno.env</code> en las Edge Functions:
                  </p>
                  <pre className="text-sm bg-gray-200 p-2 rounded mt-2">
{`// En una Edge Function de Supabase
const clientSecret = Deno.env.get("MELI_CLIENT_SECRET");

// Usarlo para obtener tokens
const response = await fetch("https://api.mercadolibre.com/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: Deno.env.get("MELI_APP_ID"),
    client_secret: clientSecret,
    code: codeFromRedirect,
    redirect_uri: redirectUri
  })
});`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-gofor-purple" />
                  Configuración de Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Mercado Libre ofrece un sistema de notificaciones en tiempo real mediante webhooks que permiten recibir actualizaciones cuando ocurren eventos en la cuenta del usuario.
                </p>
                
                <h3 className="text-lg font-semibold mt-4">Tipos de notificaciones:</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>orders_v2:</strong> Notificaciones de nuevas ventas o cambios en órdenes.</li>
                  <li><strong>items:</strong> Actualizaciones en publicaciones (cambios de precio, stock, etc).</li>
                  <li><strong>questions:</strong> Preguntas nuevas o respuestas en publicaciones.</li>
                  <li><strong>messages:</strong> Mensajes entre compradores y vendedores.</li>
                </ul>
                
                <h3 className="text-lg font-semibold mt-4">Configuración del Callback URL:</h3>
                <p>
                  Para recibir estas notificaciones, debes configurar una URL de callback en el panel de Mercado Libre Developers.
                </p>
                
                <div className="bg-gray-100 p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">URL sugerida para Webhook:</h4>
                  <code className="text-sm bg-gray-200 p-1 rounded">
                    https://gofor.com.ar/api/webhooks/meli-notifications
                  </code>
                  <p className="text-sm mt-2">
                    Esta URL debe estar configurada como una Edge Function en Supabase que procese las notificaciones entrantes.
                  </p>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">Ejemplo de procesamiento de notificación:</h4>
                  <pre className="text-sm bg-gray-200 p-2 rounded mt-2">
{`// En una Edge Function de Supabase
export async function onRequest(context) {
  // Obtener datos de la notificación
  const notification = await context.request.json();
  
  // Verificar tipo de notificación
  switch(notification.topic) {
    case 'orders_v2':
      // Procesar nueva venta
      await processNewOrder(notification.resource);
      break;
    case 'items':
      // Procesar cambio en publicación
      await processItemUpdate(notification.resource);
      break;
    // Otros casos...
  }
  
  // Responder a MeLi con 200 OK
  return new Response('OK', { status: 200 });
}`}
                  </pre>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200 text-blue-800 mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Consejo</AlertTitle>
                  <AlertDescription>
                    Es importante responder rápidamente a las notificaciones con un status 200. Si Mercado Libre no recibe respuesta, reintentará varias veces y podría desactivar las notificaciones.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ConfigurationGuide;
