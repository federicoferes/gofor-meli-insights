
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const OAuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const storedState = localStorage.getItem('meli_oauth_state');
        
        // Clean up localStorage
        localStorage.removeItem('meli_oauth_state');
        
        // Validate state to prevent CSRF attacks
        if (!state || !storedState || state !== storedState) {
          throw new Error('Invalid state parameter. Authentication attempt may have been compromised.');
        }
        
        // Extract user ID from state (format: userId:randomString)
        const userId = state.split(':')[0];
        if (!userId) {
          throw new Error('Could not determine user ID from state.');
        }
        
        // Ensure code is present
        if (!code) {
          throw new Error('Authentication code not provided by Mercado Libre.');
        }
        
        // Call Supabase edge function to exchange code for access token
        const { data, error } = await supabase.functions.invoke('meli-auth', {
          body: {
            code,
            redirect_uri: 'https://gofor-meli-insights.lovable.app/oauth/callback',
            user_id: userId
          }
        });
        
        if (error) throw new Error(error.message);
        
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
                Procesando la autenticación, por favor espere...
              </p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
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
