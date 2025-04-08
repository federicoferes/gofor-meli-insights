
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "@/types/meli";
import { getPresetDateRange, getIsoDateRange } from "@/utils/date";

/**
 * Gets a user-friendly display label for date ranges
 */
export function getDateRangeDisplayLabel(rangeType: string): string {
  switch (rangeType) {
    case "today": return "hoy";
    case "yesterday": return "ayer";
    case "7d": return "últimos 7 días";
    case "30d": return "últimos 30 días";
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
 * Handles date range selection logic
 */
export function handleDateRangeSelection(
  rangeType: string, 
  currentDate: { from: Date | undefined; to: Date | undefined },
  onDateRangeChange: (range: string, dates?: DateRange) => void,
  lastRange: React.MutableRefObject<string | null>,
  lastFromISO: React.MutableRefObject<string | null>,
  lastToISO: React.MutableRefObject<string | null>
): void {
  if (rangeType === lastRange.current && rangeType !== 'custom') {
    console.log(`🔄 DateRangePicker: Ignorando cambio de rango redundante a ${rangeType}`);
    return;
  }
  
  console.log(`🔄 DateRangePicker: Range changing to ${rangeType}`);
  lastRange.current = rangeType;
  
  const dateRange = rangeType === "custom" 
    ? currentDate 
    : getPresetDateRange(rangeType);
  
  if (rangeType !== "custom") {
    // Siempre calculamos fromISO y toISO para cualquier tipo de rango
    const { fromISO, toISO } = getIsoDateRange(dateRange);
    
    if (fromISO === lastFromISO.current && toISO === lastToISO.current) {
      console.log("📅 DateRangePicker: Ignorando cambio de fecha redundante");
      return;
    }
    
    lastFromISO.current = fromISO || null;
    lastToISO.current = toISO || null;
    
    console.log("📅 DateRangePicker changed:", rangeType, { 
      from: dateRange.from?.toISOString(), 
      to: dateRange.to?.toISOString(),
      fromISO, 
      toISO 
    });
    
    // Log the filtered date in the requested format
    const formattedDate = getDateRangeDisplayLabel(rangeType);
    console.log(`Datos de fecha "${formattedDate}": cargando...`);
    
    // Siempre incluimos fromISO y toISO
    onDateRangeChange(rangeType, { ...dateRange, fromISO, toISO });
  }
}

/**
 * Handles custom date selection from calendar
 */
export function handleCustomDateSelection(
  value: { from?: Date; to?: Date } | undefined,
  currentDate: { from: Date | undefined; to: Date | undefined },
  setDate: React.Dispatch<React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>>,
  setSelectedRange: React.Dispatch<React.SetStateAction<string>>,
  onDateRangeChange: (range: string, dates?: DateRange) => void,
  lastRange: React.MutableRefObject<string | null>,
  lastFromISO: React.MutableRefObject<string | null>,
  lastToISO: React.MutableRefObject<string | null>
): void {
  if (!value) {
    console.log("📅 Custom date selection cleared or undefined");
    return;
  }
  
  const isEqual = (d1: Date | undefined, d2: Date | undefined) => {
    if (!d1 && !d2) return true;
    if (!d1 || !d2) return false;
    return d1.getTime() === d2.getTime();
  };
  
  if (value.from && currentDate.from && value.to && currentDate.to) {
    if (isEqual(value.from, currentDate.from) && isEqual(value.to, currentDate.to)) {
      console.log("📅 Custom date selection unchanged, ignoring");
      return;
    }
  }

  console.log("📅 Custom date selection changed:", value);
  setDate({
    from: value.from || undefined,
    to: value.to || undefined
  });

  if (value.from && value.to) {
    setSelectedRange("custom");
    lastRange.current = "custom";
    
    const { fromISO, toISO } = getIsoDateRange({
      from: value.from,
      to: value.to
    });
    
    if (fromISO === lastFromISO.current && toISO === lastToISO.current) {
      console.log("📅 DateRangePicker: Ignorando cambio de fecha personalizada redundante");
      return;
    }
    
    lastFromISO.current = fromISO || null;
    lastToISO.current = toISO || null;
    
    console.log("📅 DateRangePicker custom selected:", { 
      from: value.from?.toISOString(), 
      to: value.to?.toISOString(),
      fromISO, 
      toISO 
    });
    
    // Log the custom date range in the requested format
    const formattedDateRange = formatCustomDateRange(value.from, value.to);
    console.log(`Datos de fecha "${formattedDateRange}": cargando...`);
    
    onDateRangeChange("custom", { 
      from: value.from, 
      to: value.to,
      fromISO, 
      toISO 
    });
  }
}

