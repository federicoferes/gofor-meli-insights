
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Loader2, RefreshCw } from "lucide-react";

interface DebugButtonProps {
  dateFilter: string;
  dateRange: any;
  salesSummary: any;
  userId?: string;
  onRefresh?: () => Promise<void>;
}

const DebugButton = ({ dateFilter, dateRange, salesSummary, userId, onRefresh }: DebugButtonProps) => {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) {
    return null;
  }
  
  const handleRefresh = async () => {
    if (onRefresh) {
      try {
        setRefreshing(true);
        await onRefresh();
      } catch (e) {
        console.error("Error refreshing data:", e);
      } finally {
        setRefreshing(false);
      }
    }
  };

  return (
    <div className="fixed right-4 bottom-4 flex gap-2">
      {onRefresh && (
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 
            <Loader2 className="h-4 w-4 animate-spin" /> :
            <RefreshCw className="h-4 w-4" />
          }
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Debug</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Debug Information</DialogTitle>
            <DialogDescription>
              Internal state of the Dashboard component
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm font-mono bg-slate-100 p-4 rounded-md overflow-auto max-h-[70vh]">
            <h3 className="font-bold mb-2">Date Filter:</h3>
            <pre>{JSON.stringify(dateFilter, null, 2)}</pre>
            
            <h3 className="font-bold mt-4 mb-2">Date Range:</h3>
            <pre>{JSON.stringify(dateRange, null, 2)}</pre>
            
            <h3 className="font-bold mt-4 mb-2">Sales Summary:</h3>
            <pre>{JSON.stringify(salesSummary, null, 2)}</pre>
            
            <h3 className="font-bold mt-4 mb-2">User ID:</h3>
            <pre>{JSON.stringify(userId, null, 2)}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DebugButton;
