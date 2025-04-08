
// Types for Mercado Libre data

export interface DateRange {
  from?: Date;
  to?: Date;
  fromISO?: string;
  toISO?: string;
}

export interface MeliDataOptions {
  userId: string | undefined;
  meliUserId: string | null;
  dateFilter: string;
  dateRange: DateRange;
  isConnected: boolean;
  productCostsCalculator?: (orders: any[]) => number;
  disableTestData?: boolean;
}

export interface SalesSummary {
  gmv: number;
  units: number;
  orders: number;
  visits: number;
  conversion: number;
  avgTicket: number;
  commissions?: number;
  shipping?: number;
  taxes?: number;
  advertising?: number;
  productCosts?: number;
}

export interface UseMeliDataReturn {
  isLoading: boolean;
  salesData: any[];
  salesSummary: SalesSummary;
  topProducts: any[];
  costData: any[];
  provinceData: any[];
  prevSalesSummary: SalesSummary;
  ordersData: any[];
  refresh: () => Promise<void>;
  error: string | null;
  isTestData: boolean;
}
