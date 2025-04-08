
import { SalesSummary } from "@/types/meli";
import { logSalesSummaryToConsole } from "./consoleLogger";

/**
 * Creates an object with initialized fields for sales summary
 */
export const createEmptySalesSummary = (): SalesSummary => ({
  gmv: 0,
  units: 0, 
  orders: 0,
  visits: 0, 
  conversion: 0,
  avgTicket: 0,
  commissions: 0,
  shipping: 0,
  taxes: 0,
  advertising: 0,
  productCosts: 0
});

/**
 * Calculates metric changes between current and previous periods
 * @param current Current period metric value
 * @param previous Previous period metric value
 * @returns Percentage change
 */
export const calculatePercentChange = (current: number, previous: number): number => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Processes raw sales data to calculate additional metrics
 * @param summary Sales summary object
 * @returns Processed sales summary with additional calculated metrics
 */
export const processSalesSummary = (summary: SalesSummary): SalesSummary => {
  const result = { ...summary };
  
  // Calculate conversion rate
  if (result.visits > 0 && result.units > 0) {
    result.conversion = (result.units / result.visits) * 100;
  }
  
  // Calculate average ticket
  if (result.gmv > 0 && result.orders > 0) {
    result.avgTicket = result.gmv / result.orders;
  }
  
  // Log processed summary to console for debugging
  logSalesSummaryToConsole("processed", { from: undefined, to: undefined }, result);
  
  return result;
};

/**
 * Clears any cached data to force a fresh fetch
 * @param cacheKey Key to identify cached data
 */
export const clearDataCache = (cacheKey: string): void => {
  if (typeof window !== 'undefined') {
    // Remove any cached data for this key
    localStorage.removeItem(`meli-data-${cacheKey}`);
    console.log(`🧹 Cache cleared for key: ${cacheKey}`);
  }
};
