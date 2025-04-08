
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const OAuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState('Iniciando autenticación...');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        setProcessingStep('Verificando parámetros...');
        
        // Get stored state from localStorage
        const storedState = localStorage.getItem('meli_oauth_state');
        
        // Clean up localStorage
        localStorage.removeItem('meli_oauth_state');
        
        console.log("Received state:", state);
        console.log("Stored state:", storedState);
        
        // Validate state to prevent CSRF attacks
        if (!state || !storedState || state !== storedState) {
          console.error("State validation failed", { received: state, stored: storedState });
          throw new Error('Error de validación: el parámetro state no coincide. Intente nuevamente.');
        }
        
        // Extract user ID from state (format: userId:randomString)
        const userId = state.split(':')[0];
        if (!userId) {
          throw new Error('No se pudo determinar el ID de usuario desde el estado.');
        }
        
        // Ensure code is present
        if (!code) {
          throw new Error('Mercado Libre no proporcionó el código de autenticación.');
        }
        
        console.log("Processing OAuth callback with code:", code);
        setProcessingStep('Procesando código de autorización...');
        
        // Use the production domain for redirect URI
        const redirectUri = 'https://melimetrics.app/oauth/callback';
        
        console.log("Using redirect URI:", redirectUri);
        
        // Call Supabase edge function to exchange code for access token
        setProcessingStep('Intercambiando código por token...');
        const { data, error } = await supabase.functions.invoke('meli-auth', {
          body: {
            code,
            redirect_uri: redirectUri,
            user_id: userId
          }
        });
        
        if (error) {
          console.error("Edge function error:", error);
          throw new Error(`Error en el servidor: ${error.message}`);
        }
        
        if (!data || !data.success) {
          console.error("Authentication failed:", data);
          throw new Error(data?.message || 'Error al autenticar con Mercado Libre.');
        }
        
        console.log("Authentication successful:", data);
        setProcessingStep('Autenticación exitosa');
        
        toast({
          title: "Conexión exitosa",
          description: "Tu cuenta de Mercado Libre ha sido conectada correctamente.",
        });
        
        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Error al procesar la autenticación con Mercado Libre');
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: err.message || 'Error al procesar la autenticación con Mercado Libre',
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    processOAuthCallback();
  }, [location, navigate, toast]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Conectando con Mercado Libre
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 text-gofor-purple animate-spin" />
              <p className="text-gray-600">
                {processingStep}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-gofor-purple h-2.5 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="font-semibold text-red-600 mb-2">Error:</h3>
              <p className="mb-4">{error}</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="mt-4 text-gofor-purple hover:underline"
              >
                Ir al panel de control
              </button>
            </div>
          ) : (
            <div className="text-center text-green-600">
              <p className="font-semibold">¡Conexión exitosa!</p>
              <p>Redirigiendo al panel de control...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
