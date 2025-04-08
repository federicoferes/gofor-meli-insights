
import { SalesSummary } from "@/types/meli";
import { formatDateLabelForDisplay } from "./dateFormatters";

/**
 * Centralized utility for logging date range selections
 */
export function logDateRangeSelection(
  rangeType: string,
  dateRange: { from?: Date; to?: Date },
  fromISO?: string,
  toISO?: string
): void {
  console.log(`🔄 DateRangePicker: Range changing to ${rangeType}`);
  
  if (dateRange.from && dateRange.to) {
    console.log("📅 DateRangePicker changed:", rangeType, { 
      from: dateRange.from?.toISOString(), 
      to: dateRange.to?.toISOString(),
      fromISO, 
      toISO 
    });
    
    // Log the filtered date in the requested format
    const formattedDate = formatDateLabelForDisplay(rangeType, dateRange);
    console.log(`Datos de fecha "${formattedDate}": cargando...`);
  }
}

/**
 * Logs sales summary data to console in the requested format
 */
export function logSalesSummaryToConsole(
  dateFilter: string,
  dateRange: { from?: Date, to?: Date },
  summary: SalesSummary
): void {
  const dateLabel = formatDateLabelForDisplay(dateFilter, dateRange);
  
  console.log(`Datos de fecha "${dateLabel}":`, {
    "ventas totales (GMV)": summary.gmv,
    "unidades": summary.units,
    "órdenes": summary.orders,
    "visitas": summary.visits,
    "conversión": summary.conversion.toFixed(2) + "%",
    "ticket promedio": summary.avgTicket
  });
}

/**
 * Logs a custom date selection change
 */
export function logCustomDateSelection(
  value: { from?: Date; to?: Date } | undefined,
  fromISO?: string,
  toISO?: string
): void {
  console.log("📅 Custom date selection changed:", value);
  
  if (value?.from && value?.to) {
    console.log("📅 DateRangePicker custom selected:", { 
      from: value.from?.toISOString(), 
      to: value.to?.toISOString(),
      fromISO, 
      toISO 
    });
    
    // Log the custom date range in the requested format
    const formattedDateRange = formatCustomDateRange(value.from, value.to);
    console.log(`Datos de fecha "${formattedDateRange}": cargando...`);
  }
}
