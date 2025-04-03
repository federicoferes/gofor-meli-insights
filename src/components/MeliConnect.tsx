
import React from 'react';
import { Button } from "@/components/ui/button";

const MeliConnect = () => {
  // Function to handle MeLi OAuth connection
  const handleMeliConnect = () => {
    // Using the actual Mercado Libre app ID
    const MELI_APP_ID = '8830083472538103';
    const REDIRECT_URI = 'https://gofor-meli-insights.lovable.app/oauth/callback';
    const STATE = Math.random().toString(36).substring(2);
    
    // Save state to validate later
    localStorage.setItem('meli_oauth_state', STATE);
    
    // Construct the authorization URL
    const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${MELI_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}`;
    
    // Redirect to MeLi auth page
    window.location.href = authUrl;
  };

  return (
    <Button 
      onClick={handleMeliConnect}
      className="bg-gofor-purple hover:bg-gofor-lightPurple text-white flex items-center gap-2 px-6 py-3"
    >
      <img 
        src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/favicon.svg" 
        alt="Mercado Libre logo" 
        className="w-5 h-5"
      />
      Conectar con Mercado Libre
    </Button>
  );
};

export default MeliConnect;
