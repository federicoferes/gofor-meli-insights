
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  id?: string;
  user_id?: string;
  item_id: string;
  title: string;
  cost: number | null;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  thumbnail?: string | null;
  permalink?: string | null;
}

interface UseProductsProps {
  userId: string | undefined;
  meliUserId: string | null;
  isConnected: boolean;
  dateFilter: string;
  dateRange: {
    from?: Date;
    to?: Date;
    fromISO?: string;
    toISO?: string;
  };
}

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  updateProductCost: (productId: string, newCost: number | null) => Promise<void>;
  calculateSoldProductsCost: (orders: any[]) => number;
}

export function useProducts({
  userId,
  meliUserId,
  isConnected,
  dateFilter,
  dateRange
}: UseProductsProps): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    if (!userId || !isConnected || !meliUserId) {
      return;
    }

    setIsLoading(true);
    try {
      // First, check products in Supabase
      const { data: storedProducts, error: dbError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
      
      if (dbError) {
        throw new Error(`Error fetching stored products: ${dbError.message}`);
      }

      // Then fetch products from MeLi API through our edge function
      const { data: meliData, error: meliError } = await supabase.functions.invoke('meli-data', {
        body: {
          user_id: userId,
          batch_requests: [
            {
              endpoint: `/users/${meliUserId}/items/search`,
              params: { limit: 100 }
            }
          ]
        }
      });

      if (meliError) {
        throw new Error(`Error fetching MeLi products: ${meliError.message}`);
      }

      if (!meliData?.batch_results?.[0]?.results?.length) {
        console.log("No products found in MeLi API");
        return;
      }

      // Get the item IDs from the search results
      const itemIds = meliData.batch_results[0].results;
      
      // Fetch details for each product
      const productDetailsPromises = [];
      for (let i = 0; i < itemIds.length; i += 20) {
        // Process in batches of 20
        const batch = itemIds.slice(i, i + 20);
        productDetailsPromises.push(
          supabase.functions.invoke('meli-data', {
            body: {
              user_id: userId,
              batch_requests: batch.map((itemId: string) => ({
                endpoint: `/items/${itemId}`,
                params: {}
              }))
            }
          })
        );
      }

      const detailsResponses = await Promise.all(productDetailsPromises);
      
      // Process all product details and update/insert to Supabase
      const productItems: Product[] = [];
      for (const response of detailsResponses) {
        if (response.data?.batch_results) {
          for (const item of response.data.batch_results) {
            if (item) {
              const product: Product = {
                user_id: userId,
                item_id: item.id,
                title: item.title,
                price: item.price,
                available_quantity: item.available_quantity,
                sold_quantity: item.sold_quantity || 0,
                thumbnail: item.thumbnail,
                permalink: item.permalink,
                // Find cost from stored products or default to null
                cost: null
              };

              // Find if we already have this product with a cost
              const existingProduct = storedProducts?.find(p => p.item_id === item.id);
              if (existingProduct) {
                product.id = existingProduct.id;
                product.cost = existingProduct.cost;
              }

              productItems.push(product);
              
              // Upsert to database
              await supabase
                .from('products')
                .upsert(product, { onConflict: 'user_id,item_id' });
            }
          }
        }
      }

      setProducts(productItems);
      toast({
        title: "Productos sincronizados",
        description: `Se han sincronizado ${productItems.length} productos desde Mercado Libre`,
        duration: 3000
      });

    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error al obtener productos",
        description: error.message || "No se pudieron cargar los productos",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, meliUserId, isConnected, toast]);

  // Initial load
  useEffect(() => {
    if (userId && isConnected && meliUserId) {
      fetchProducts();
    }
  }, [userId, meliUserId, isConnected, fetchProducts]);

  const updateProductCost = useCallback(async (productId: string, newCost: number | null) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ cost: newCost, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Update local state
      setProducts(prev => 
        prev.map(product => 
          product.id === productId ? { ...product, cost: newCost } : product
        )
      );

      toast({
        title: "Costo actualizado",
        description: "El costo del producto ha sido actualizado correctamente",
      });
    } catch (error: any) {
      console.error("Error updating product cost:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar costo",
        description: error.message || "No se pudo actualizar el costo del producto",
      });
    }
  }, [userId, toast]);

  const calculateSoldProductsCost = useCallback((orders: any[]): number => {
    if (!orders || !orders.length || !products.length) {
      return 0;
    }

    let totalCost = 0;

    // Aggregate quantities of items sold in the period
    const soldItems: Record<string, number> = {};
    
    orders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const itemId = item.item?.id;
          if (itemId) {
            soldItems[itemId] = (soldItems[itemId] || 0) + (item.quantity || 0);
          }
        });
      }
    });

    // Calculate costs
    Object.entries(soldItems).forEach(([itemId, quantity]) => {
      const product = products.find(p => p.item_id === itemId);
      if (product && product.cost !== null) {
        totalCost += product.cost * quantity;
      }
    });

    return totalCost;
  }, [products]);

  return {
    products,
    isLoading,
    fetchProducts,
    updateProductCost,
    calculateSoldProductsCost
  };
}
