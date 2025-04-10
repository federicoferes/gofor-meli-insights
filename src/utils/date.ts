
import { startOfDay, endOfDay, addHours, subDays, format } from 'date-fns';

// UTC-3 Argentina
const ARG_OFFSET = -3;
const ARG_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Genera un rango de fechas ajustado a la zona horaria Argentina (UTC-3)
 * @param base Fecha base para generar el rango
 * @returns Objeto con fechas de inicio y fin ajustadas a UTC
 */
export const getArgDateRange = (base: Date) => {
  // Ajustamos a la zona horaria de Argentina (UTC-3)
  const from = addHours(startOfDay(base), -ARG_OFFSET);
  const to = addHours(endOfDay(base), -ARG_OFFSET);
  
  console.log(`getArgDateRange - base: ${base.toISOString()}, from: ${from.toISOString()}, to: ${to.toISOString()}`);
  
  return { from, to };
};

/**
 * Genera rangos de fecha predefinidos ajustados a Argentina
 * @param rangeType Tipo de rango (today, yesterday, 7d, 30d)
 * @returns Objeto con fechas from y to
 */
export const getPresetDateRange = (rangeType: string) => {
  const now = new Date();
  console.log(`getPresetDateRange - rangeType: ${rangeType}, now: ${now.toISOString()}`);
  
  switch (rangeType) {
    case "today":
      return getArgDateRange(now);
    case "yesterday":
      return getArgDateRange(subDays(now, 1));
    case "7d":
      const sevenDays = {
        from: addHours(startOfDay(subDays(now, 7)), -ARG_OFFSET),
        to: addHours(endOfDay(now), -ARG_OFFSET)
      };
      console.log(`getPresetDateRange - 7d: from: ${sevenDays.from.toISOString()}, to: ${sevenDays.to.toISOString()}`);
      return sevenDays;
    case "30d":
      const thirtyDays = {
        from: addHours(startOfDay(subDays(now, 30)), -ARG_OFFSET),
        to: addHours(endOfDay(now), -ARG_OFFSET)
      };
      console.log(`getPresetDateRange - 30d: from: ${thirtyDays.from.toISOString()}, to: ${thirtyDays.to.toISOString()}`);
      return thirtyDays;
    default:
      return getArgDateRange(now);
  }
};

/**
 * Formatea una fecha para API requests (ISO string)
 * Asegura que incluya milisegundos y zona horaria
 */
export const formatDateForApi = (date: Date, isEndOfDay = false): string => {
  if (!date) return "";
  
  if (isEndOfDay) {
    // Asegurarse de que tenga milisegundos
    const withMs = new Date(date);
    withMs.setMilliseconds(999);
    const result = withMs.toISOString();
    console.log(`formatDateForApi - isEndOfDay=true, date: ${date.toISOString()}, result: ${result}`);
    return result;
  }
  
  const result = date.toISOString();
  console.log(`formatDateForApi - isEndOfDay=false, date: ${date.toISOString()}, result: ${result}`);
  return result;
};

/**
 * Formatea una fecha en ISO 8601 con milisegundos y zona horaria -03:00 (Argentina)
 * Ejemplo: 2025-04-06T00:00:00.000-03:00
 */
export const formatDateForMeLi = (date: Date, isEndOfDay = false): string => {
  if (!date) return "";

  const d = new Date(date);

  if (isEndOfDay) {
    d.setHours(23, 59, 59, 999);
  }

  const iso = d.toISOString(); // Ej: 2025-04-06T03:00:00.000Z
  const result = iso.replace("Z", "-03:00"); // Lo convierte a horario argentino explícito
  
  console.log(`formatDateForMeLi - input: ${date.toISOString()}, isEndOfDay: ${isEndOfDay}, output: ${result}`);
  return result;
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
    
    const result = date >= from && date <= to;
    
    return result;
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
    console.log(`getIsoDateRange - dateRange incompleto: ${JSON.stringify(dateRange)}`);
    return {
      fromISO: undefined,
      toISO: undefined
    };
  }
  
  // Usar el nuevo formato para asegurar que tenemos milisegundos y zona horaria
  const fromISO = formatDateForMeLi(dateRange.from);
  const toISO = formatDateForMeLi(dateRange.to, true);
  
  console.log(`getIsoDateRange - resultado: fromISO: ${fromISO}, toISO: ${toISO}`);
  
  return { fromISO, toISO };
};
