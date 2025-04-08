
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/types/meli';

// Define the Toast type interface here to avoid import issues
interface Toast {
  variant?: "default" | "destructive";
  title?: string;
  description?: string;
  duration?: number;
}

/**
 * Builds the request payload for the meli-data edge function
 */
export function buildMeliDataPayload(
  userId: string | undefined,
  meliUserId: string | null,
  dateRange: DateRange,
  disableTestData: boolean
) {
  // Prepare date parameters
  const dateFrom = dateRange.fromISO || null;
  const dateTo = dateRange.toISO || null;

  console.log("Building payload with date range:", { dateFrom, dateTo });

  // Prepare batch requests - ONLY USE orders/search, not orders/search/recent
  // This ensures date filters work properly
  const batchRequests = [
    {
      endpoint: '/orders/search',
      params: {
        seller: meliUserId,  // Ya incluimos el seller ID aquí también por seguridad
        sort: 'date_desc',
        limit: 50,
        // We explicitly do NOT add date params here, the edge function will handle them
      }
    }
  ];

  // Prepare payload for the edge function
  return {
    user_id: userId,
    batch_requests: batchRequests,
    date_range: dateFrom && dateTo ? {
      begin: dateFrom,
      end: dateTo
    } : null,
    timezone: 'America/Argentina/Buenos_Aires',
    prev_period: true,
    use_cache: false,
    disable_test_data: disableTestData
  };
}

/**
 * Fetches data from the meli-data edge function
 */
export async function fetchMeliData(
  payload: any, 
  toastFn: { toast: (props: Toast) => void }
) {
  console.log('🛰 Enviando payload a meli-data:', JSON.stringify(payload, null, 2));

  try {
    // Call the edge function to fetch data from MeLi
    console.time('meli-data-fetch');
    const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
      body: payload
    });
    console.timeEnd('meli-data-fetch');
    
    if (batchError) {
      console.error('Error from edge function:', batchError);
      throw new Error(`Error al obtener datos: ${batchError.message}`);
    }
    
    if (!batchData) {
      console.error('No data received from edge function');
      throw new Error("No se recibieron datos de la función meli-data");
    }

    console.log('Received response from meli-data:', batchData);

    // Handle API errors
    if (!batchData.success) {
      console.error('API request unsuccessful:', batchData);
      
      // Handle rate limiting specifically
      if (batchData.error?.includes('429') || batchData.message?.includes('rate_limit')) {
        throw new Error('Límite de solicitudes excedido. Por favor, inténtalo de nuevo en unos minutos.');
      }
      
      // Handle authentication errors
      if (batchData.error?.includes('401') || batchData.message?.includes('unauthorized') || batchData.message?.includes('authentication')) {
        throw new Error('Error de autenticación con Mercado Libre. Por favor, reconecta tu cuenta.');
      }
      
      throw new Error(batchData?.message || batchData?.error || 'Error desconocido al obtener datos');
    }
    
    return { data: batchData, error: null };
  } catch (error: any) {
    const errorMessage = error.message || "No se pudieron cargar los datos de Mercado Libre.";
    console.error('Error fetching MeLi data:', errorMessage);
    
    toastFn.toast({
      variant: "destructive",
      title: "Error cargando datos",
      description: errorMessage,
      duration: 5000
    });
    
    return { data: null, error: errorMessage };
  }
}

/**
 * Disconnects a user's Mercado Libre account
 */
export async function disconnectMeliAccount(
  userId: string,
  toastFn: { toast: (props: Toast) => void }
) {
  try {
    const { data, error } = await supabase.functions.invoke('meli-disconnect', {
      body: { user_id: userId }
    });
    
    if (error) {
      throw new Error(`Error al desconectar: ${error.message}`);
    }
    
    if (!data || !data.success) {
      throw new Error(data?.message || 'Error al desconectar la cuenta');
    }
    
    toastFn.toast({
      title: "Cuenta desconectada",
      description: "Tu cuenta de Mercado Libre ha sido desconectada correctamente.",
      duration: 3000
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error disconnecting MeLi account:', error);
    
    toastFn.toast({
      variant: "destructive",
      title: "Error al desconectar",
      description: error.message || "No se pudo desconectar la cuenta de Mercado Libre.",
      duration: 5000
    });
    
    return { success: false, error: error.message };
  }
}
