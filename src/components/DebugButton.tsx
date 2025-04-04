
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

type DebugButtonProps = {
  dateFilter: string;
  dateRange: any;
  salesSummary: any;
  userId?: string;
};

const DebugButton = ({ dateFilter, dateRange, salesSummary, userId }: DebugButtonProps) => {
  const handleDebugClick = () => {
    console.log('📊 Valores actuales del dashboard:', {
      dateFilter,
      dateRange,
      gmv: salesSummary.gmv,
      units: salesSummary.units,
      avgTicket: salesSummary.avgTicket,
      sessionUser: userId,
    });
  };

  // Only show in development
  if (import.meta.env.DEV) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDebugClick}
        className="fixed bottom-4 right-4 bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug
      </Button>
    );
  }
  
  return null;
};

export default DebugButton;
