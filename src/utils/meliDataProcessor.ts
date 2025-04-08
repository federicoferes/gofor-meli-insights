
import { SalesSummary } from "../types/meli";

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

/**
 * Formats date label for console log based on date filter
 */
export const formatDateLabelForConsole = (
  dateFilter: string, 
  dateRange: { from?: Date, to?: Date }
): string => {
  return dateFilter === "today" ? "hoy" : 
         dateFilter === "yesterday" ? "ayer" : 
         dateFilter === "7d" ? "últimos 7 días" : 
         dateFilter === "30d" ? "últimos 30 días" : 
         dateFilter === "custom" && dateRange.from && dateRange.to ? 
         `${dateRange.from.toLocaleDateString('es-AR')} - ${dateRange.to.toLocaleDateString('es-AR')}` : dateFilter;
};

/**
 * Logs sales summary data to console in the requested format
 */
export const logSalesSummaryToConsole = (
  dateFilter: string,
  dateRange: { from?: Date, to?: Date },
  summary: SalesSummary
): void => {
  const dateLabel = formatDateLabelForConsole(dateFilter, dateRange);
  
  console.log(`Datos de fecha "${dateLabel}":`, {
    "ventas totales (GMV)": summary.gmv,
    "unidades": summary.units,
    "órdenes": summary.orders,
    "visitas": summary.visits,
    "conversión": summary.conversion.toFixed(2) + "%",
    "ticket promedio": summary.avgTicket
  });
};
