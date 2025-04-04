
/**
 * Formatea un número como moneda en formato argentino
 * @param value - El valor a formatear
 * @param options - Opciones de formato
 * @returns El valor formateado como string
 */
export const formatCurrency = (value: number | string | undefined, options?: Intl.NumberFormatOptions): string => {
  const numberValue = Number(value) || 0;
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(numberValue);
};

/**
 * Formatea un número con separadores de miles
 * @param value - El valor a formatear
 * @param options - Opciones de formato
 * @returns El valor formateado como string
 */
export const formatNumber = (value: number | string | undefined, options?: Intl.NumberFormatOptions): string => {
  const numberValue = Number(value) || 0;
  
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(numberValue);
};

/**
 * Formatea un número como porcentaje
 * @param value - El valor a formatear
 * @param options - Opciones de formato
 * @returns El valor formateado como string
 */
export const formatPercent = (value: number | string | undefined, options?: Intl.NumberFormatOptions): string => {
  const numberValue = Number(value) || 0;
  
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options
  }).format(numberValue / 100);
};

/**
 * Realiza cálculos de forma segura entre valores que pueden ser undefined
 * @param operation - La función que realiza el cálculo
 * @param defaultValue - El valor por defecto si hay un error
 * @returns El resultado del cálculo o el valor por defecto
 */
export const safeCalculation = <T>(operation: () => T, defaultValue: T): T => {
  try {
    return operation();
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Calcula el balance total de forma segura
 * @param gmv - Ventas totales
 * @param commissions - Comisiones
 * @param shipping - Costos de envío
 * @returns El balance calculado
 */
export const calculateBalance = (
  gmv: number | string | undefined,
  commissions: number | string | undefined,
  shipping: number | string | undefined
): number => {
  return safeCalculation(() => {
    return (Number(gmv) || 0) - (Number(commissions) || 0) - (Number(shipping) || 0);
  }, 0);
};
