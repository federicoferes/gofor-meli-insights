
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
  const formatDateToISO = (date: Date, endOfDayFlag = false): string => {
    if (endOfDayFlag) {
      return endOfDay(date).toISOString();
    }
    return startOfDay(date).toISOString();
  };

  // Function to get the date range based on the selected option
  const getDateRange = (rangeType: string): { from: Date | undefined; to: Date | undefined } => {
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
        return date;
      default:
        fromDate = startOfDay(subDays(today, 30));
        return { from: fromDate, to: today };
    }
  };

  const handleRangeChange = (value: string) => {
    console.log(`🔄 DateRangePicker: Range changing to ${value}`);
    setSelectedRange(value);
    
    // Generate date range based on selected option
    const dateRange = getDateRange(value);
    
    // Only pass ISO strings if we have valid dates
    if (value !== "custom") {
      setDate(dateRange);
      
      // Add ISO formatted dates to the callback
      let fromISO, toISO;
      if (dateRange.from) {
        fromISO = formatDateToISO(dateRange.from);
      }
      if (dateRange.to) {
        toISO = formatDateToISO(dateRange.to, true); // End of day for the to-date
      }
      
      console.log("📅 DateRangePicker changed:", value, { 
        from: dateRange.from?.toISOString(), 
        to: dateRange.to?.toISOString(),
        fromISO, 
        toISO 
      });
      
      onDateRangeChange(value, { ...dateRange, fromISO, toISO });
    } else {
      // For custom, we'll rely on the custom date picker
      // Add ISO formatted dates if they exist
      let fromISO, toISO;
      if (date.from) {
        fromISO = formatDateToISO(date.from);
      }
      if (date.to) {
        toISO = formatDateToISO(date.to, true); // End of day for the to-date
      }
      
      console.log("📅 DateRangePicker custom:", { 
        from: date.from?.toISOString(), 
        to: date.to?.toISOString(),
        fromISO, 
        toISO 
      });
      
      onDateRangeChange(value, { ...date, fromISO, toISO });
    }
  };

  const handleCustomDateChange = (value: { from: Date | undefined; to: Date | undefined }) => {
    console.log("📅 Custom date selection changed:", value);
    setDate(value);
    if (value.from && value.to) {
      setSelectedRange("custom");
      
      // Add ISO formatted dates
      const fromISO = value.from ? formatDateToISO(value.from) : undefined;
      const toISO = value.to ? formatDateToISO(value.to, true) : undefined; // End of day for the to-date
      
      console.log("📅 DateRangePicker custom selected:", { 
        from: value.from?.toISOString(), 
        to: value.to?.toISOString(),
        fromISO, 
        toISO 
      });
      
      onDateRangeChange("custom", { ...value, fromISO, toISO });
    }
  };

  // Initialize with the default date range on mount
  useEffect(() => {
    console.log("📅 DateRangePicker initialized with default range:", selectedRange);
    handleRangeChange(selectedRange);
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
