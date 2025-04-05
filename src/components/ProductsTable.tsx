
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';

interface Product {
  id?: string;
  user_id?: string;
  item_id: string;
  title: string;
  cost: number | null;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  thumbnail?: string | null;
  permalink?: string | null;
}

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateCost: (productId: string, newCost: number | null) => Promise<void>;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ 
  products, 
  isLoading, 
  onRefresh, 
  onUpdateCost 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEditStart = (product: Product) => {
    if (!product.id) return;
    
    setEditingId(product.id);
    setEditValue(product.cost !== null ? String(product.cost) : '');
  };

  const handleSave = async (product: Product) => {
    if (!product.id) return;
    
    const numValue = editValue === '' ? null : parseFloat(editValue);
    await onUpdateCost(product.id, numValue);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, product: Product) => {
    if (e.key === 'Enter') {
      handleSave(product);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Productos ({products.length})</h2>
        <Button 
          onClick={onRefresh} 
          disabled={isLoading} 
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            'Sincronizar productos'
          )}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Vendidos</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const isEditing = product.id === editingId;
              const margin = product.cost !== null 
                ? (product.price - product.cost) / product.price * 100 
                : null;
              
              return (
                <TableRow key={product.item_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {product.thumbnail && (
                        <img 
                          src={product.thumbnail} 
                          alt={product.title} 
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="truncate max-w-xs">{product.title}</div>
                        {product.permalink && (
                          <a 
                            href={product.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Ver en MeLi
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex w-full max-w-28">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, product)}
                          className="h-8 text-right"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="text-right">
                        {product.cost !== null ? formatCurrency(product.cost) : '-'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {margin !== null ? `${margin.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.available_quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.sold_quantity)}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex space-x-1">
                        <Button 
                          onClick={() => handleSave(product)} 
                          size="sm" 
                          variant="outline"
                        >
                          Guardar
                        </Button>
                        <Button 
                          onClick={handleCancel} 
                          size="sm" 
                          variant="ghost"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleEditStart(product)}
                        size="sm"
                        variant="ghost"
                      >
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {products.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No hay productos disponibles
                </TableCell>
              </TableRow>
            )}
            {isLoading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Cargando productos...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductsTable;
