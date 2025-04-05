
import React, { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateRangePickerProps = {
  onDateRangeChange: (range: string, dates?: { 
    from: Date | undefined; 
    to: Date | undefined;
    fromISO?: string;
    toISO?: string;
  }) => void;
};

const DateRangePicker = ({ onDateRangeChange }: DateRangePickerProps) => {
  const [selectedRange, setSelectedRange] = useState<string>("today");
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Function to safely format dates to ISO 8601 string
  const formatDateToISO = (date: Date | undefined, endOfDayFlag = false): string | undefined => {
    if (!date) {
      console.log("⚠️ Cannot format undefined date to ISO");
      return undefined;
    }
    
    try {
      if (endOfDayFlag) {
        return endOfDay(date).toISOString();
      }
      return startOfDay(date).toISOString();
    } catch (error) {
      console.error("Error formatting date to ISO:", error, date);
      return undefined;
    }
  };

  // Function to get the date range based on the selected option
  const getDateRange = (rangeType: string): { from: Date | undefined; to: Date | undefined } => {
    try {
      const today = new Date();
      let fromDate: Date | undefined;
      
      switch (rangeType) {
        case "today":
          fromDate = startOfDay(new Date(today));
          return { from: fromDate, to: today };
        case "yesterday":
          fromDate = startOfDay(subDays(today, 1));
          return { from: fromDate, to: subDays(today, 1) };
        case "7d":
          fromDate = startOfDay(subDays(today, 7));
          return { from: fromDate, to: today };
        case "30d":
          fromDate = startOfDay(subDays(today, 30));
          return { from: fromDate, to: today };
        case "custom":
          // Make sure to return a safe copy of date to avoid mutation issues
          // Add safety check to avoid "Cannot read properties of undefined" errors
          if (!date) {
            console.warn("⚠️ Date is undefined when requesting custom date range");
            return { from: undefined, to: undefined };
          }
          return { from: date.from, to: date.to };
        default:
          fromDate = startOfDay(subDays(today, 30));
          return { from: fromDate, to: today };
      }
    } catch (error) {
      console.error("Error calculating date range:", error, "rangeType:", rangeType);
      // Return safe defaults
      return { from: undefined, to: undefined };
    }
  };

  const handleRangeChange = (value: string) => {
    if (!value) {
      console.error("⚠️ DateRangePicker: Range value is undefined or empty");
      return;
    }
    
    console.log(`🔄 DateRangePicker: Range changing to ${value}`);
    setSelectedRange(value);
    
    try {
      // Generate date range based on selected option
      const dateRange = getDateRange(value);
      
      // Safety check - ensure dateRange is properly defined
      if (!dateRange) {
        console.error("⚠️ DateRangePicker: dateRange is undefined");
        return;
      }
      
      if (value !== "custom") {
        setDate(dateRange);
        
        // Add ISO formatted dates to the callback
        const fromISO = dateRange.from ? formatDateToISO(dateRange.from) : undefined;
        const toISO = dateRange.to ? formatDateToISO(dateRange.to, true) : undefined;
        
        console.log("📅 DateRangePicker changed:", value, { 
          from: dateRange.from?.toISOString(), 
          to: dateRange.to?.toISOString(),
          fromISO, 
          toISO 
        });
        
        onDateRangeChange(value, { 
          from: dateRange.from, 
          to: dateRange.to,
          fromISO, 
          toISO 
        });
      } else {
        // For custom, we'll rely on the custom date picker
        // Only trigger a change if we have valid dates
        if (date?.from && date?.to) {
          const fromISO = formatDateToISO(date.from);
          const toISO = formatDateToISO(date.to, true);
          
          console.log("📅 DateRangePicker custom:", { 
            from: date.from?.toISOString(), 
            to: date.to?.toISOString(),
            fromISO, 
            toISO 
          });
          
          onDateRangeChange(value, { 
            from: date.from, 
            to: date.to,
            fromISO, 
            toISO 
          });
        } else {
          console.log("⚠️ DateRangePicker: Custom date range is incomplete", date);
          // Still notify the parent component but with undefined dates
          onDateRangeChange(value, {
            from: undefined,
            to: undefined,
            fromISO: undefined,
            toISO: undefined
          });
        }
      }
    } catch (error) {
      console.error("Error in handleRangeChange:", error, value);
      // Notify with safe defaults
      onDateRangeChange(value, {
        from: undefined,
        to: undefined,
        fromISO: undefined,
        toISO: undefined
      });
    }
  };

  const handleCustomDateChange = (newDateRange: { from?: Date; to?: Date } | undefined) => {
    // Safely handle potentially undefined value
    if (!newDateRange) {
      console.log("📅 Custom date selection cleared or undefined");
      setDate({ from: undefined, to: undefined });
      return;
    }

    try {
      const updatedRange = {
        from: newDateRange.from || undefined,
        to: newDateRange.to || undefined
      };
      
      console.log("📅 Custom date selection changed:", updatedRange);
      setDate(updatedRange);

      // Only trigger the callback if we have both from and to dates
      if (newDateRange.from && newDateRange.to) {
        setSelectedRange("custom");
        
        // Add ISO formatted dates
        const fromISO = formatDateToISO(newDateRange.from);
        const toISO = formatDateToISO(newDateRange.to, true);
        
        console.log("📅 DateRangePicker custom selected:", { 
          from: newDateRange.from?.toISOString(), 
          to: newDateRange.to?.toISOString(),
          fromISO, 
          toISO 
        });
        
        onDateRangeChange("custom", { 
          from: newDateRange.from, 
          to: newDateRange.to,
          fromISO, 
          toISO 
        });
      }
    } catch (error) {
      console.error("Error in handleCustomDateChange:", error, newDateRange);
    }
  };

  // Initialize with the default date range on mount
  useEffect(() => {
    try {
      console.log("📅 DateRangePicker initialized with default range:", selectedRange);
      
      // Safely initialize the date range
      const initialDateRange = getDateRange(selectedRange);
      
      // Safety check - ensure initialDateRange is properly defined
      if (!initialDateRange) {
        console.error("⚠️ DateRangePicker: initialDateRange is undefined");
        return;
      }
      
      setDate(initialDateRange);
      
      // Notify parent component
      const fromISO = initialDateRange.from ? formatDateToISO(initialDateRange.from) : undefined;
      const toISO = initialDateRange.to ? formatDateToISO(initialDateRange.to, true) : undefined;
      
      onDateRangeChange(selectedRange, {
        from: initialDateRange.from,
        to: initialDateRange.to,
        fromISO,
        toISO
      });
    } catch (error) {
      console.error("Error initializing DateRangePicker:", error);
    }
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder="Seleccionar periodo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="yesterday">Ayer</SelectItem>
          <SelectItem value="7d">Últimos 7 días</SelectItem>
          <SelectItem value="30d">Últimos 30 días</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {selectedRange === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal bg-white",
                !date?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date?.to ? (
                  <>
                    {format(date.from, "P", { locale: es })} -{" "}
                    {format(date.to, "P", { locale: es })}
                  </>
                ) : (
                  format(date.from, "P", { locale: es })
                )
              ) : (
                <span>Seleccionar fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date?.from && date?.to ? {
                from: date.from,
                to: date.to
              } : undefined}
              onSelect={handleCustomDateChange}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default DateRangePicker;
