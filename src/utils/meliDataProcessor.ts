
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
  avgTicket: 0
});
