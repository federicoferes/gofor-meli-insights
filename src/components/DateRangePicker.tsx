
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

  // Function to format dates to ISO 8601 string
  const formatDateToISO = (date: Date | undefined, endOfDayFlag = false): string | undefined => {
    if (!date) return undefined;
    
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
    const today = new Date();
    let fromDate: Date | undefined;
    
    try {
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
          return date || { from: undefined, to: undefined };
        default:
          fromDate = startOfDay(subDays(today, 30));
          return { from: fromDate, to: today };
      }
    } catch (error) {
      console.error("Error calculating date range:", error, rangeType);
      return { from: undefined, to: undefined };
    }
  };

  const handleRangeChange = (value: string) => {
    console.log(`🔄 DateRangePicker: Range changing to ${value}`);
    setSelectedRange(value);
    
    try {
      // Generate date range based on selected option
      const dateRange = getDateRange(value);
      
      if (!dateRange) {
        console.error("⚠️ DateRangePicker: dateRange is undefined for value:", value);
        return;
      }
      
      // Only pass ISO strings if we have valid dates
      if (value !== "custom") {
        setDate(dateRange);
        
        // Add ISO formatted dates to the callback
        const fromISO = dateRange.from ? formatDateToISO(dateRange.from) : undefined;
        const toISO = dateRange.to ? formatDateToISO(dateRange.to, true) : undefined; // End of day for the to-date
        
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
        // Add ISO formatted dates if they exist
        const fromISO = date?.from ? formatDateToISO(date.from) : undefined;
        const toISO = date?.to ? formatDateToISO(date.to, true) : undefined; // End of day for the to-date
        
        console.log("📅 DateRangePicker custom:", { 
          from: date?.from?.toISOString(), 
          to: date?.to?.toISOString(),
          fromISO, 
          toISO 
        });
        
        onDateRangeChange(value, { 
          from: date?.from, 
          to: date?.to,
          fromISO, 
          toISO 
        });
      }
    } catch (error) {
      console.error("Error in handleRangeChange:", error, value);
    }
  };

  const handleCustomDateChange = (value: { from?: Date; to?: Date } | undefined) => {
    // Safely handle potentially undefined value
    if (!value) {
      console.log("📅 Custom date selection cleared or undefined");
      return;
    }

    try {
      console.log("📅 Custom date selection changed:", value);
      setDate({
        from: value.from || undefined,
        to: value.to || undefined
      });

      // Only trigger the callback if we have both from and to dates
      if (value.from && value.to) {
        setSelectedRange("custom");
        
        // Add ISO formatted dates
        const fromISO = formatDateToISO(value.from);
        const toISO = formatDateToISO(value.to, true); // End of day for the to-date
        
        console.log("📅 DateRangePicker custom selected:", { 
          from: value.from?.toISOString(), 
          to: value.to?.toISOString(),
          fromISO, 
          toISO 
        });
        
        onDateRangeChange("custom", { 
          from: value.from, 
          to: value.to,
          fromISO, 
          toISO 
        });
      }
    } catch (error) {
      console.error("Error in handleCustomDateChange:", error, value);
    }
  };

  // Initialize with the default date range on mount
  useEffect(() => {
    try {
      console.log("📅 DateRangePicker initialized with default range:", selectedRange);
      handleRangeChange(selectedRange);
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

      {selectedRange === "custom" && date && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal bg-white",
                !date.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date.from ? (
                date.to ? (
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
              defaultMonth={date.from}
              selected={date}
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
