
import { DateRange } from "@/types/meli";
import { getPresetDateRange, getIsoDateRange } from "@/utils/date";
import { logDateRangeSelection, logCustomDateSelection } from "./consoleLogger";
import { formatCustomDateRange } from "./dateFormatters";

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
    
    logDateRangeSelection(rangeType, dateRange, fromISO, toISO);
    
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
    
    logCustomDateSelection(value, fromISO, toISO);
    
    onDateRangeChange("custom", { 
      from: value.from, 
      to: value.to,
      fromISO, 
      toISO 
    });
  }
}
