
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const MeliConnect = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if user is logged in
    const checkUserSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          // Check if user is already connected to MeLi
          try {
            const { data: connectionData, error } = await supabase.functions.invoke('meli-data', {
              body: { user_id: data.session.user.id }
            });
            
            if (!error && connectionData?.is_connected) {
              setIsConnected(true);
            }
          } catch (error) {
            console.error("Error checking MeLi connection:", error);
          }
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
    const REDIRECT_URI = 'https://gofor-meli-insights.lovable.app/oauth/callback';
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
      <Button 
        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-3"
        disabled
      >
        <img 
          src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/favicon.svg" 
          alt="Mercado Libre logo" 
          className="w-5 h-5"
        />
        Conectado con Mercado Libre
      </Button>
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
