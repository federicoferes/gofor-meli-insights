
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Info, Check, RefreshCw, LogOut, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MeliConnect = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
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
              console.log("Conexión MeLi verificada:", connectionData);
              setIsConnected(true);
              setConnectionDetails({
                meli_user_id: connectionData.meli_user_id
              });
              
              // Verificar estado del token
              const { data: tokenData } = await supabase
                .from('meli_tokens')
                .select('access_token, refresh_token, expires_at, created_at')
                .eq('user_id', data.session.user.id)
                .single();
                
              if (tokenData) {
                const expiresAt = new Date(tokenData.expires_at);
                const now = new Date();
                const expiresIn = Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60); // minutos
                
                setTokenStatus({
                  isValid: expiresIn > 0,
                  expiresIn,
                  expiresAt: tokenData.expires_at,
                  createdAt: tokenData.created_at
                });
                
                console.log(`Token expira en ${expiresIn} minutos (${expiresAt.toLocaleString()})`);
              }
            }
          } catch (error) {
            console.error("Error checking MeLi connection:", error);
            toast({
              variant: "destructive",
              title: "Error de conexión",
              description: "No se pudo verificar la conexión con Mercado Libre."
            });
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
  }, [toast]);

  // Function to handle MeLi OAuth connection
  const handleMeliConnect = () => {
    if (!user) return;
    
    setIsConnecting(true);
    
    try {
      // Using the actual Mercado Libre app ID
      const MELI_APP_ID = '8830083472538103';
      const REDIRECT_URI = 'https://melimetrics.app/oauth/callback';
      
      // Generate a state parameter that includes the user ID and a random string
      const randomStateValue = crypto.randomUUID();
      const STATE = `${user.id}:${randomStateValue}`;
      
      console.log("Generated OAuth state:", STATE);
      
      // Save state to localStorage to validate later
      localStorage.setItem('meli_oauth_state', STATE);
      
      // Construct the authorization URL
      const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${MELI_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}`;
      
      // Redirect to MeLi auth page
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating MeLi OAuth flow:", error);
      setIsConnecting(false);
      
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo iniciar el proceso de conexión con Mercado Libre."
      });
    }
  };

  // Manual token refresh function
  const handleManualRefresh = async () => {
    if (!user?.id) return;
    
    try {
      setIsConnecting(true);
      toast({
        title: "Refrescando token",
        description: "Actualizando credenciales de Mercado Libre..."
      });
      
      // Llamar directamente al endpoint de refresh en meli-data
      const refreshResult = await supabase.functions.invoke('meli-data', {
        body: { 
          user_id: user.id, 
          batch_requests: [{
            endpoint: '/users/me',
            params: {}
          }]
        }
      });
      
      if (refreshResult.error) {
        throw new Error(refreshResult.error);
      }
      
      // Verificar estado del token nuevamente
      const { data: tokenData } = await supabase
        .from('meli_tokens')
        .select('access_token, refresh_token, expires_at, created_at')
        .eq('user_id', user.id)
        .single();
        
      if (tokenData) {
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        const expiresIn = Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60); // minutos
        
        setTokenStatus({
          isValid: expiresIn > 0,
          expiresIn,
          expiresAt: tokenData.expires_at,
          createdAt: tokenData.created_at
        });
        
        toast({
          title: "Token actualizado",
          description: `Credenciales actualizadas correctamente. Válido por ${expiresIn} minutos.`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error("Error refrescando token:", error);
      toast({
        variant: "destructive",
        title: "Error de actualización",
        description: "No se pudo actualizar las credenciales. Intente reconectar su cuenta."
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle disconnecting from Mercado Libre
  const handleDisconnect = async () => {
    if (!user?.id) return;
    
    try {
      setIsDisconnecting(true);
      
      // Llamar al edge function para revocar token
      const { data, error } = await supabase.functions.invoke('meli-disconnect', {
        body: { user_id: user.id }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data?.success) {
        throw new Error(data?.message || 'Error al desconectar la cuenta');
      }
      
      // Actualizar estado local
      setIsConnected(false);
      setConnectionDetails(null);
      setTokenStatus(null);
      
      // Mostrar mensaje de éxito
      toast({
        title: "Cuenta desconectada",
        description: "Tu cuenta de Mercado Libre ha sido desconectada correctamente.",
      });
      
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast({
        variant: "destructive",
        title: "Error al desconectar",
        description: error.message || "No se pudo desconectar la cuenta de Mercado Libre."
      });
    } finally {
      setIsDisconnecting(false);
      setConfirmDisconnect(false);
    }
  };

  if (isLoading) {
    return (
      <Button disabled variant="outline" className="bg-white text-gray-600 border-gray-300">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <TooltipProvider>
        <Dialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-3"
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
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cuenta de Mercado Libre conectada</DialogTitle>
              <DialogDescription>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-sm font-medium">ID de vendedor:</p>
                    <p className="text-sm">{connectionDetails?.meli_user_id || 'Desconocido'}</p>
                  </div>
                  
                  {tokenStatus && (
                    <div>
                      <p className="text-sm font-medium">Estado del token:</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${tokenStatus.isValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <p className="text-sm">{tokenStatus.isValid ? 'Válido' : 'Expirado'}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {tokenStatus.isValid 
                          ? `Expira en ${tokenStatus.expiresIn} minutos (${new Date(tokenStatus.expiresAt).toLocaleString()})`
                          : `Expiró el ${new Date(tokenStatus.expiresAt).toLocaleString()}`}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm">La aplicación tiene acceso a tus datos de ventas, productos y métricas de Mercado Libre.</p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="pt-3 flex justify-between gap-2">
              <Button
                variant="outline" 
                onClick={() => setConfirmDisconnect(true)}
                disabled={isDisconnecting}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Desconectar cuenta
              </Button>
              
              <Button
                variant="default"
                onClick={handleManualRefresh}
                disabled={isConnecting || isDisconnecting}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar token
                {isConnecting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Confirmation dialog for disconnecting */}
        <Dialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>¿Desconectar cuenta de Mercado Libre?</DialogTitle>
              <DialogDescription>
                Esta acción revocará el acceso de la aplicación a tu cuenta de Mercado Libre.
                Tendrás que volver a autorizar la aplicación para acceder a tus datos.
              </DialogDescription>
            </DialogHeader>
            
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Al desconectar la cuenta, no podrás acceder a tus métricas de ventas hasta que vuelvas a conectarte.
              </AlertDescription>
            </Alert>
            
            <DialogFooter className="flex justify-end gap-2 sm:justify-end">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDisconnect(false)}
                disabled={isDisconnecting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex items-center gap-2"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Desconectar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
