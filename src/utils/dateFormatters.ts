
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Gets a user-friendly display label for date ranges
 */
export function getDateRangeDisplayLabel(rangeType: string): string {
  switch (rangeType) {
    case "today": return "hoy";
    case "yesterday": return "ayer";
    case "7d": return "últimos 7 días";
    case "30d": return "últimos 30 días";
    case "custom": return "personalizado";
    default: return rangeType;
  }
}

/**
 * Gets a formatted string representation of a date range
 */
export function formatCustomDateRange(from?: Date, to?: Date): string {
  const formattedFromDate = from ? format(from, "dd/MM/yyyy", { locale: es }) : '';
  const formattedToDate = to ? format(to, "dd/MM/yyyy", { locale: es }) : '';
  return `${formattedFromDate} - ${formattedToDate}`;
}

/**
 * Formats date label for console log or display based on date filter
 */
export function formatDateLabelForDisplay(
  dateFilter: string, 
  dateRange: { from?: Date, to?: Date }
): string {
  if (dateFilter === "custom" && dateRange.from && dateRange.to) {
    return formatCustomDateRange(dateRange.from, dateRange.to);
  }
  
  return getDateRangeDisplayLabel(dateFilter);
}
