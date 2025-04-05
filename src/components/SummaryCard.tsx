
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  percentChange?: number;
  icon?: React.ReactNode;
  colorClass?: string;
  emptyText?: string;
}

const SummaryCard = ({ 
  title, 
  value, 
  percentChange, 
  icon, 
  colorClass = "bg-white",
  emptyText = "Sin datos" 
}: SummaryCardProps) => {
  const isPositiveChange = percentChange !== undefined && percentChange >= 0;
  const hasPercentChange = percentChange !== undefined;
  const isEmpty = value === 0 || value === undefined || value === null || value === "";
  
  return (
    <Card className={`shadow-md ${colorClass}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-2xl font-bold font-poppins mt-1">
              {isEmpty ? <span className="text-gray-400">{emptyText}</span> : value}
            </p>
            
            {hasPercentChange ? (
              <div className={`flex items-center mt-2 text-sm font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>{isPositiveChange ? '+' : ''}{percentChange.toFixed(1)}% vs periodo anterior</span>
              </div>
            ) : (
              <div className="flex items-center mt-2 text-sm font-medium text-gray-400">
                <Minus className="h-4 w-4 mr-1" />
                <span>Sin datos comparativos</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="p-2 rounded-full bg-gofor-purple/10 text-gofor-purple">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
