
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SummaryCardProps {
  title: React.ReactNode; 
  value: string | number;
  percentChange?: number;
  icon?: React.ReactNode;
  colorClass?: string;
  isLoading?: boolean;
  suffix?: string;
  additionalInfo?: string | null; 
  isTestData?: boolean;
  tooltip?: string;
}

const SummaryCard = ({ 
  title, 
  value, 
  percentChange, 
  icon, 
  colorClass = "bg-white",
  isLoading = false,
  suffix = "",
  additionalInfo,
  isTestData = false,
  tooltip
}: SummaryCardProps) => {
  // Determine if percent change is positive
  const isPositiveChange = percentChange !== undefined && percentChange >= 0;
  
  // Check if we have a valid percent change value
  const hasPercentChange = percentChange !== undefined && !isNaN(percentChange);
  
  // Improve validation for values
  const isEmptyValue = value === undefined || value === null || value === '' || value === 0;
  const displayValue = isLoading ? "Cargando..." : (isEmptyValue ? "Sin datos" : `${value}${suffix}`);
  
  // Dynamic color by percentage
  const percentColor = isPositiveChange ? 'text-green-600' : 'text-red-600';
  
  return (
    <Card className={`shadow-md ${colorClass} transition-all duration-200 hover:shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
              {title}
              {isTestData && (
                <span className="inline-flex items-center text-amber-500 text-xs font-normal" title="Datos de ejemplo para visualización">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Demo
                </span>
              )}
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      <Info className="h-3 w-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs p-2">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className={`text-2xl font-bold font-poppins mt-1 ${isLoading ? 'opacity-50' : ''} ${isTestData ? 'text-amber-500' : ''}`}>
              {displayValue}
            </p>
            
            {additionalInfo && !isLoading && (
              <div className="text-sm text-gray-500 mt-1">
                {additionalInfo}
              </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center mt-2 text-sm font-medium text-gray-400">
                <span>Cargando datos comparativos...</span>
              </div>
            ) : hasPercentChange ? (
              <div className={`flex items-center mt-2 text-sm font-medium ${isTestData ? 'text-amber-500' : percentColor}`}>
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>
                  {isPositiveChange ? '+' : ''}
                  {Number(percentChange).toFixed(1)}% vs periodo anterior
                </span>
              </div>
            ) : (
              <div className="flex items-center mt-2 text-sm font-medium text-gray-500">
                <span>Sin datos comparativos</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className={`p-2 rounded-full ${isTestData ? 'bg-amber-100 text-amber-500' : 'bg-gofor-purple/10 text-gofor-purple'}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
