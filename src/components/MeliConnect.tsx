
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Info, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MeliConnect = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if user is logged in and MeLi connection status
    const checkUserSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          setIsLoggedIn(true);
          setUser(data.session.user);
          
          // Check if user is already connected to MeLi
          try {
            const { data: connectionData, error } = await supabase.functions.invoke('meli-data', {
              body: { user_id: data.session.user.id }
            });
            
            if (!error && connectionData?.is_connected) {
              setIsConnected(true);
              setConnectionDetails({
                meli_user_id: connectionData.meli_user_id
              });
            }
          } catch (error) {
            console.error("Error checking MeLi connection:", error);
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
          setIsConnected(false);
          setConnectionDetails(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      setUser(session?.user || null);
      
      if (!session) {
        setIsConnected(false);
        setConnectionDetails(null);
      } else if (session?.user) {
        // Check MeLi connection again when auth state changes
        supabase.functions.invoke('meli-data', {
          body: { user_id: session.user.id }
        }).then(({ data, error }) => {
          if (!error && data?.is_connected) {
            setIsConnected(true);
            setConnectionDetails({
              meli_user_id: data.meli_user_id
            });
          }
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Function to handle MeLi OAuth connection
  const handleMeliConnect = () => {
    if (!user) return;
    
    setIsConnecting(true);
    
    // Using the actual Mercado Libre app ID
    const MELI_APP_ID = '8830083472538103';
    const REDIRECT_URI = 'https://melimetrics.app/oauth/callback';
    const STATE = `${user.id}:${Math.random().toString(36).substring(2)}`;
    
    // Save state to validate later
    localStorage.setItem('meli_oauth_state', STATE);
    
    // Construct the authorization URL
    const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${MELI_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}`;
    
    // Redirect to MeLi auth page
    window.location.href = authUrl;
  };

  if (isLoading) {
    return (
      <Button disabled className="bg-gray-300 text-gray-600">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-3"
              disabled
            >
              <img 
                src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/favicon.svg" 
                alt="Mercado Libre logo" 
                className="w-5 h-5"
              />
              <span className="flex items-center gap-1">
                Conectado con Mercado Libre
                <Check className="h-4 w-4 ml-1" />
              </span>
              <Info className="h-4 w-4 ml-1 text-white opacity-70" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="p-1">
              <p className="font-medium">Cuenta de Mercado Libre conectada</p>
              <p className="text-xs mt-1">ID: {connectionDetails?.meli_user_id || 'Desconocido'}</p>
              <p className="text-xs mt-2">La aplicación tiene acceso a tus datos de ventas, productos y métricas.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button 
      onClick={handleMeliConnect}
      className="bg-gofor-purple hover:bg-gofor-lightPurple text-white flex items-center gap-2 px-6 py-3"
      disabled={!isLoggedIn || isConnecting}
    >
      {isConnecting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <img 
          src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/favicon.svg" 
          alt="Mercado Libre logo" 
          className="w-5 h-5"
        />
      )}
      {isConnecting ? 'Conectando...' : 'Conectar con Mercado Libre'}
      {!isLoggedIn && <span className="text-xs ml-1">(Regístrate primero)</span>}
    </Button>
  );
};

export default MeliConnect;
