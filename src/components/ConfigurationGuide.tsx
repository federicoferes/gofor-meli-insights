
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Code, Webhook } from "lucide-react";

const ConfigurationGuide = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-gofor-purple" />
          Guía de Configuración
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meli">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meli">Mercado Libre</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meli" className="space-y-4 mt-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuración de Mercado Libre Developers</AlertTitle>
              <AlertDescription>
                Para que la conexión con Mercado Libre funcione correctamente, debes configurar estos parámetros en tu aplicación de Mercado Libre Developers.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">1. URLs de Redirección</h3>
                <div className="bg-slate-100 p-3 rounded-md">
                  <p className="text-sm font-mono break-all">https://melimetrics.app/oauth/callback</p>
                </div>
                <p className="text-sm text-slate-600 mt-1">Configura esta URL en tu aplicación de Mercado Libre Developers.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">2. Scopes necesarios</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li className="text-sm">read</li>
                  <li className="text-sm">write</li>
                  <li className="text-sm">offline_access</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Configuración General</AlertTitle>
              <AlertDescription>
                Asegúrate de que tu dominio esté correctamente configurado.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">1. Configuración de Supabase</h3>
                <p className="text-sm">Asegúrate de que las siguientes URLs estén configuradas en Supabase:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li className="text-sm">
                    <strong>Site URL:</strong> https://melimetrics.app
                  </li>
                  <li className="text-sm">
                    <strong>Redirect URLs:</strong> https://melimetrics.app/oauth/callback
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">2. Prueba la configuración</h3>
                <p className="text-sm">Una vez configurados todos los parámetros, intenta conectar tu cuenta de Mercado Libre desde el panel.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConfigurationGuide;
