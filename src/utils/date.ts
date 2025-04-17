
import { startOfDay, endOfDay, addHours, subDays, format } from 'date-fns';

// UTC-3 Argentina
const ARG_OFFSET = -3;

/**
 * Genera un rango de fechas ajustado a la zona horaria Argentina (UTC-3)
 * @param base Fecha base para generar el rango
 * @returns Objeto con fechas de inicio y fin ajustadas a UTC
 */
export const getArgDateRange = (base: Date) => {
  console.log(`Generando rango para fecha base: ${base.toISOString()}`);
  // Ajustamos a la zona horaria de Argentina (UTC-3)
  const from = addHours(startOfDay(base), -ARG_OFFSET);
  const to = addHours(endOfDay(base), -ARG_OFFSET);
  console.log(`Rango generado: ${from.toISOString()} - ${to.toISOString()}`);
  return { from, to };
};

/**
 * Genera rangos de fecha predefinidos ajustados a Argentina
 * @param rangeType Tipo de rango (today, yesterday, 7d, 30d)
 * @returns Objeto con fechas from y to
 */
export const getPresetDateRange = (rangeType: string) => {
  console.log(`Generando preset para: ${rangeType}`);
  const now = new Date();
  
  switch (rangeType) {
    case "today":
      return getArgDateRange(now);
    case "yesterday":
      return getArgDateRange(subDays(now, 1));
    case "7d":
      return {
        from: addHours(startOfDay(subDays(now, 7)), -ARG_OFFSET),
        to: addHours(endOfDay(now), -ARG_OFFSET)
      };
    case "30d":
      return {
        from: addHours(startOfDay(subDays(now, 30)), -ARG_OFFSET),
        to: addHours(endOfDay(now), -ARG_OFFSET)
      };
    default:
      return getArgDateRange(now);
  }
};

/**
 * Formatea una fecha para API requests (ISO string)
 */
export const formatDateForApi = (date: Date, isEndOfDay = false): string => {
  if (!date) return "";
  
  if (isEndOfDay) {
    // Asegurarse de que tenga milisegundos
    const withMs = new Date(date);
    withMs.setMilliseconds(999);
    return withMs.toISOString();
  }
  return date.toISOString();
};

/**
 * Convierte una fecha ISO a una fecha local considerando la offset de Argentina
 */
export const isoToArgDate = (isoString: string): Date => {
  if (!isoString) return new Date();
  
  const date = new Date(isoString);
  return addHours(date, ARG_OFFSET);
};

/**
 * Determina si una fecha está en un rango específico
 */
export const isDateInRange = (dateStr: string, fromStr: string, toStr: string): boolean => {
  try {
    if (!dateStr || !fromStr || !toStr) return false;
    
    const date = new Date(dateStr);
    const from = new Date(fromStr);
    const to = new Date(toStr);
    
    return date >= from && date <= to;
  } catch (error) {
    console.error("Error validando rango de fechas:", error);
    return false;
  }
};

/**
 * Formatea la fecha para mostrar en la UI con formato argentino
 */
export const formatDateForDisplay = (date: Date): string => {
  if (!date) return "";
  return format(date, 'dd/MM/yyyy');
};

/**
 * Crea un objeto con ISO strings para las APIs
 */
export const getIsoDateRange = (dateRange: { from?: Date; to?: Date }) => {
  if (!dateRange.from || !dateRange.to) {
    console.log("⚠️ dateRange incompleto:", dateRange);
    return {
      fromISO: undefined,
      toISO: undefined
    };
  }
  
  const fromISO = formatDateForApi(dateRange.from);
  const toISO = formatDateForApi(dateRange.to, true);
  
  console.log(`ISODateRange generado: ${fromISO} - ${toISO}`);
  return { fromISO, toISO };
};
