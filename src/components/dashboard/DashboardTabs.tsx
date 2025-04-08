
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ProductsTable from '@/components/ProductsTable';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  salesData: any[];
  costData: any[];
  provinceData: any[];
  topProducts: any[];
  products: any[];
  productsLoading: boolean;
  costDistributionData: any[];
  salesSummary: any;
  isLoading: boolean;
  onRefreshData: () => Promise<void>;
  onFetchProducts: () => Promise<void>;
  onUpdateProductCost: (productId: string, newCost: number | null) => Promise<void>;
}

const COLORS = ['#663399', '#FFD700', '#8944EB', '#FF8042', '#9B59B6', '#4ade80'];

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  setActiveTab,
  salesData,
  costData,
  provinceData,
  topProducts,
  products,
  productsLoading,
  costDistributionData,
  salesSummary,
  isLoading,
  onRefreshData,
  onFetchProducts,
  onUpdateProductCost
}) => {
  return (
    <>
      <Tabs 
        defaultValue="ventas" 
        className="mb-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6 bg-white border">
          <TabsTrigger 
            value="ventas" 
            className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
          >
            Ventas
          </TabsTrigger>
          <TabsTrigger 
            value="costos" 
            className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
          >
            Costos
          </TabsTrigger>
          <TabsTrigger 
            value="productos" 
            className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
          >
            Productos Vendidos
          </TabsTrigger>
          <TabsTrigger 
            value="inventario" 
            className="data-[state=active]:bg-gofor-purple data-[state=active]:text-white"
          >
            Inventario
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="ventas">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ventas']}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Ventas ($)" fill="#663399" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas por provincia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={provinceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {provinceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ventas']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="costos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-500 mb-1">Comisiones</div>
                <div className="text-2xl font-bold text-gofor-purple">{formatCurrency(salesSummary.commissions || 0)}</div>
                <div className="text-sm font-medium text-red-500">
                  {((Number(salesSummary.commissions || 0) / Math.max(Number(salesSummary.gmv || 0), 1)) * 100).toFixed(1)}% del GMV
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-500 mb-1">Impuestos</div>
                <div className="text-2xl font-bold text-gofor-purple">{formatCurrency(salesSummary.taxes || 0)}</div>
                <div className="text-sm font-medium text-gray-500">
                  {((Number(salesSummary.taxes || 0) / Math.max(Number(salesSummary.gmv || 0), 1)) * 100).toFixed(1)}% del GMV
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-500 mb-1">IVA ({salesSummary.ivaRate || 21}%)</div>
                <div className="text-2xl font-bold text-gofor-purple">
                  {formatCurrency(salesSummary.gmv ? salesSummary.gmv * ((salesSummary.ivaRate || 21) / 100) : 0)}
                </div>
                <div className="text-sm font-medium text-amber-500">{salesSummary.ivaRate || 21}% del GMV</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Distribución de costos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Monto']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="productos">
          <Card>
            <CardHeader>
              <CardTitle>Productos más vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Producto</TableHead>
                        <TableHead className="text-right font-semibold">Unidades</TableHead>
                        <TableHead className="text-right font-semibold">Ingresos</TableHead>
                        <TableHead className="text-right font-semibold">% del Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50">
                          <TableCell>{product.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(product.units)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                          <TableCell className="text-right">
                            {((Number(product.revenue) / Math.max(topProducts.reduce((sum, p) => sum + Number(p.revenue), 0), 1)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No hay datos de productos vendidos para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventario">
          <ProductsTable 
            products={products}
            isLoading={productsLoading}
            onRefresh={onFetchProducts}
            onUpdateCost={onUpdateProductCost}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mb-8">
        <Button 
          onClick={onRefreshData}
          variant="outline"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Actualizar datos
        </Button>
      </div>
    </>
  );
};

export default DashboardTabs;
