
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

  // Prepare simplified batch requests
  const batchRequests = [
    {
      endpoint: '/orders/search',
      params: {
        seller: meliUserId,
        sort: 'date_desc',
        limit: 50,
      }
    },
    {
      endpoint: `/orders/search/recent`,
      params: {
        seller: meliUserId,
        limit: 50,
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
