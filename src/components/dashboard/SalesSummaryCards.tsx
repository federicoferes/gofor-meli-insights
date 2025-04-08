
import React from 'react';
import { SalesSummary } from '@/types/meli';
import SummaryCard from '@/components/SummaryCard';
import { DollarSign, ShoppingBag, BarChart3, CreditCard, Users, Percent, Truck, Calculator, Megaphone, Package } from "lucide-react";
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SalesSummaryCardsProps {
  salesSummary: SalesSummary;
  prevSalesSummary: SalesSummary;
  isLoading: boolean;
  isTestData: boolean;
  currentBalance: number;
  previousBalance: number;
  currentIva: number;
  previousIva: number;
  ivaRate: number;
  onIvaRateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const calculatePercentChange = (current: number, previous: number): number => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

const SalesSummaryCards: React.FC<SalesSummaryCardsProps> = ({
  salesSummary,
  prevSalesSummary,
  isLoading,
  isTestData,
  currentBalance,
  previousBalance,
  currentIva,
  previousIva,
  ivaRate,
  onIvaRateChange
}) => {
  const advertisingGmvPercent = salesSummary.gmv > 0 && salesSummary.advertising > 0
    ? ((salesSummary.advertising / salesSummary.gmv) * 100).toFixed(1)
    : null;

  const productCostsGmvPercent = salesSummary.gmv > 0 && salesSummary.productCosts > 0
    ? ((salesSummary.productCosts / salesSummary.gmv) * 100).toFixed(1)
    : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-2">
          <SummaryCard 
            title={
              <div className="flex items-center justify-between">
                <span>Balance Total</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <Calculator className="h-4 w-4 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium mb-2">Configuración de tasa IVA</h4>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={ivaRate}
                          onChange={onIvaRateChange}
                          className="w-20"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span>%</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        La tasa de IVA se usa para calcular el balance total:
                        GMV - comisiones - envíos - impuestos - IVA({ivaRate}% del GMV) - publicidad - costo productos
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            }
            value={formatCurrency(currentBalance)}
            percentChange={calculatePercentChange(currentBalance, previousBalance)}
            icon={<DollarSign className="h-5 w-5" />}
            isLoading={isLoading}
            colorClass="bg-gradient-to-r from-gofor-purple/10 to-gofor-purple/5"
            tooltip="Balance calculado como GMV - comisiones - envíos - impuestos - IVA - publicidad - costos de productos"
            isTestData={isTestData}
          />
        </div>
        <SummaryCard 
          title="GMV (Ventas totales)"
          value={formatCurrency(salesSummary.gmv || 0)}
          percentChange={calculatePercentChange(salesSummary.gmv || 0, prevSalesSummary.gmv || 0)}
          icon={<ShoppingBag className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="Calculado como la suma de precio unitario * cantidad de todos los items vendidos"
          isTestData={isTestData}
        />
        <SummaryCard 
          title="Unidades vendidas"
          value={formatNumber(salesSummary.units || 0)}
          percentChange={calculatePercentChange(salesSummary.units || 0, prevSalesSummary.units || 0)}
          icon={<BarChart3 className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="Total de unidades (quantity) vendidas en todas las órdenes"
          isTestData={isTestData}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard 
          title="Ticket promedio"
          value={formatCurrency(salesSummary.avgTicket || 0)}
          percentChange={calculatePercentChange(salesSummary.avgTicket || 0, prevSalesSummary.avgTicket || 0)}
          icon={<CreditCard className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="GMV / Número de órdenes"
          isTestData={isTestData}
        />
        <SummaryCard 
          title="Visitas"
          value={formatNumber(salesSummary.visits || 0)}
          percentChange={calculatePercentChange(salesSummary.visits || 0, prevSalesSummary.visits || 0)}
          icon={<Users className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="Suma de visitas a productos publicados desde /visits/items"
          isTestData={isTestData}
        />
        <SummaryCard 
          title="Tasa de conversión"
          value={Number(salesSummary.conversion || 0).toFixed(1)}
          suffix="%"
          percentChange={calculatePercentChange(salesSummary.conversion || 0, prevSalesSummary.conversion || 0)}
          icon={<Percent className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="(Unidades vendidas / Visitas) * 100"
          isTestData={isTestData}
        />
        <SummaryCard 
          title="IVA (aplicado)"
          value={formatCurrency(currentIva)}
          percentChange={calculatePercentChange(currentIva, previousIva)}
          icon={<DollarSign className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip={`GMV * ${ivaRate}% (configurable)`}
          isTestData={isTestData}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard 
          title="Comisiones totales"
          value={formatCurrency(salesSummary.commissions || 0)}
          percentChange={calculatePercentChange(salesSummary.commissions || 0, prevSalesSummary.commissions || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="Suma de fee_details[].amount de todas las órdenes"
          isTestData={isTestData}
        />
        <SummaryCard 
          title="Costos de envío"
          value={formatCurrency(salesSummary.shipping || 0)}
          percentChange={calculatePercentChange(salesSummary.shipping || 0, prevSalesSummary.shipping || 0)}
          icon={<Truck className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="Suma de shipping.shipping_option.cost de todas las órdenes"
          isTestData={isTestData}
        />
        <SummaryCard 
          title="Impuestos"
          value={formatCurrency(salesSummary.taxes || 0)}
          percentChange={calculatePercentChange(salesSummary.taxes || 0, prevSalesSummary.taxes || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          isLoading={isLoading}
          tooltip="Suma de taxes[].amount en órdenes"
          isTestData={isTestData}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <SummaryCard 
          title="Gastos de Publicidad"
          value={formatCurrency(salesSummary.advertising || 0)}
          percentChange={calculatePercentChange(
            salesSummary.advertising || 0, 
            prevSalesSummary.advertising || 0
          )}
          icon={<Megaphone className="h-5 w-5" />}
          isLoading={isLoading}
          additionalInfo={advertisingGmvPercent ? `${advertisingGmvPercent}% del GMV` : null}
          tooltip="Gastos de campañas desde /advertising/campaigns/search (0 si no hay datos)"
          isTestData={isTestData}
        />
        <SummaryCard 
          title="Costo de Productos Vendidos"
          value={formatCurrency(salesSummary.productCosts || 0)}
          percentChange={calculatePercentChange(
            salesSummary.productCosts || 0, 
            prevSalesSummary.productCosts || 0
          )}
          icon={<Package className="h-5 w-5" />}
          isLoading={isLoading}
          additionalInfo={productCostsGmvPercent ? `${productCostsGmvPercent}% del GMV` : null}
          tooltip="Suma del costo registrado * cantidad vendida de cada producto"
          isTestData={isTestData}
        />
      </div>
    </>
  );
};

export default SalesSummaryCards;
