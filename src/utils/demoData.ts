
import { DateRange } from '@/types/meli';
import { addDays, addMonths, format, parseISO, subDays, subMonths } from 'date-fns';

// Helper function to create date strings in ISO format
const formatDateISO = (date: Date): string => format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

// Generate realistic looking data
export function generateDemoData(dateRange: DateRange) {
  const today = new Date();
  let fromDate = today;
  let toDate = today;
  
  // If dateRange is provided, use it
  if (dateRange.fromISO && dateRange.toISO) {
    fromDate = parseISO(dateRange.fromISO);
    toDate = parseISO(dateRange.toISO);
  } else {
    // Default to last 30 days
    fromDate = subDays(today, 30);
  }

  // Generate data for the last 6 months regardless of the date range
  // This ensures we have enough data for the demo
  const sixMonthsAgo = subMonths(today, 6);

  // Generate monthly sales data (for the charts)
  const salesData = generateMonthlySalesData(sixMonthsAgo, today);
  
  // Generate performance data (for charts)
  const performanceData = generatePerformanceData(sixMonthsAgo, today);
  
  // Generate cost distribution data
  const costData = generateCostDistributionData();
  
  // Generate top products data
  const topProducts = generateTopProductsData();
  
  // Generate province data
  const provinceData = generateProvinceData();
  
  // Generate summary statistics
  const salesSummary = generateSalesSummary();
  const prevSalesSummary = generatePrevSalesSummary(salesSummary);

  return {
    salesData,
    performanceData,
    costData,
    topProducts,
    provinceData,
    salesSummary,
    prevSalesSummary,
  };
}

function generateMonthlySalesData(startDate: Date, endDate: Date) {
  const months = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const monthName = format(currentDate, 'MMM');
    const value = Math.floor(Math.random() * 400000) + 800000; // Between 800k and 1.2M
    const prevValue = value * (Math.random() * 0.4 + 0.8); // Between 80% and 120% of current value
    
    months.push({
      name: monthName,
      value,
      prevValue: Math.floor(prevValue),
    });
    
    currentDate = addMonths(currentDate, 1);
  }
  
  return months;
}

function generatePerformanceData(startDate: Date, endDate: Date) {
  const months = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const monthName = format(currentDate, 'MMM');
    const gmv = Math.floor(Math.random() * 1500000) + 1000000; // Between 1M and 2.5M
    const orders = Math.floor(Math.random() * 2000) + 3000; // Between 3000 and 5000
    const conversion = (Math.random() * 2 + 3).toFixed(1); // Between 3 and 5
    
    months.push({
      name: monthName,
      GMV: gmv,
      Orders: orders,
      Conversion: parseFloat(conversion),
    });
    
    currentDate = addMonths(currentDate, 1);
  }
  
  return months;
}

function generateCostDistributionData() {
  return [
    { name: 'Comisiones', value: Math.floor(Math.random() * 50000) + 80000 },
    { name: 'Impuestos', value: Math.floor(Math.random() * 100000) + 180000 },
    { name: 'Envíos', value: Math.floor(Math.random() * 40000) + 60000 },
    { name: 'Descuentos', value: Math.floor(Math.random() * 30000) + 40000 },
    { name: 'Anulaciones', value: Math.floor(Math.random() * 20000) + 20000 },
  ];
}

function generateTopProductsData() {
  const products = [
    { id: 1, name: 'Smartphone Galaxy S21', units: Math.floor(Math.random() * 100) + 150, revenue: Math.floor(Math.random() * 50000) + 150000 },
    { id: 2, name: 'Notebook HP 15"', units: Math.floor(Math.random() * 80) + 100, revenue: Math.floor(Math.random() * 80000) + 120000 },
    { id: 3, name: 'Auriculares Sony WH-1000XM4', units: Math.floor(Math.random() * 120) + 180, revenue: Math.floor(Math.random() * 40000) + 90000 },
    { id: 4, name: 'Smart TV Samsung 55"', units: Math.floor(Math.random() * 60) + 70, revenue: Math.floor(Math.random() * 70000) + 110000 },
    { id: 5, name: 'Tablet iPad 10.2"', units: Math.floor(Math.random() * 70) + 90, revenue: Math.floor(Math.random() * 60000) + 100000 },
  ];
  
  return products;
}

function generateProvinceData() {
  return [
    { name: 'Buenos Aires', value: 45 },
    { name: 'CABA', value: 25 },
    { name: 'Córdoba', value: 15 },
    { name: 'Santa Fe', value: 8 },
    { name: 'Mendoza', value: 7 },
  ];
}

function generateSalesSummary() {
  const gmv = Math.floor(Math.random() * 1500000) + 2500000; // Between 2.5M and 4M
  const orders = Math.floor(Math.random() * 3000) + 7000; // Between 7000 and 10000
  const avgTicket = Math.floor(gmv / orders);
  
  return {
    gmv,
    orders,
    avgTicket,
    conversion: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Between 3 and 5
    visits: Math.floor(Math.random() * 100000) + 150000, // Between 150k and 250k
    commissions: Math.floor(gmv * 0.13), // ~13% of GMV
    taxes: Math.floor(gmv * 0.21), // 21% of GMV
    shipping: Math.floor(gmv * 0.07), // ~7% of GMV
    discounts: Math.floor(gmv * 0.05), // ~5% of GMV
    cancellations: Math.floor(gmv * 0.02), // ~2% of GMV
  };
}

function generatePrevSalesSummary(currentSummary: any) {
  // Generate previous period summary with values slightly lower than current
  return {
    gmv: Math.floor(currentSummary.gmv * 0.92), // 92% of current
    orders: Math.floor(currentSummary.orders * 0.94), // 94% of current
    avgTicket: Math.floor(currentSummary.avgTicket * 0.98), // 98% of current
    conversion: parseFloat((currentSummary.conversion * 0.95).toFixed(1)), // 95% of current
    visits: Math.floor(currentSummary.visits * 0.9), // 90% of current
  };
}
