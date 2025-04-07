
import React, { useState, useEffect, useRef } from 'react';
import { format, startOfDay, endOfDay, subDays, isEqual } from "date-fns";
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
  
  // Referencia para evitar redisparo al inicializar
  const isInitialized = useRef(false);
  const lastRange = useRef<string | null>(null);
  const lastFromISO = useRef<string | null>(null);
  const lastToISO = useRef<string | null>(null);

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
    // Si ya estamos en el mismo rango, no hacemos nada
    if (value === lastRange.current && value !== 'custom') {
      console.log(`🔄 DateRangePicker: Ignorando cambio de rango redundante a ${value}`);
      return;
    }
    
    console.log(`🔄 DateRangePicker: Range changing to ${value}`);
    setSelectedRange(value);
    lastRange.current = value;
    
    // Generate date range based on selected option
    const dateRange = getDateRange(value);
    
    // Only pass ISO formatted dates if we have valid dates
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
      
      // Verificar si es redundante con la última selección
      if (fromISO === lastFromISO.current && toISO === lastToISO.current) {
        console.log("📅 DateRangePicker: Ignorando cambio de fecha redundante");
        return;
      }
      
      lastFromISO.current = fromISO || null;
      lastToISO.current = toISO || null;
      
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
      
      // Verificar si es redundante con la última selección
      if (fromISO === lastFromISO.current && toISO === lastToISO.current) {
        console.log("📅 DateRangePicker: Ignorando cambio de fecha personalizada redundante");
        return;
      }
      
      lastFromISO.current = fromISO || null;
      lastToISO.current = toISO || null;
      
      console.log("📅 DateRangePicker custom:", { 
        from: date.from?.toISOString(), 
        to: date.to?.toISOString(),
        fromISO, 
        toISO 
      });
      
      onDateRangeChange(value, { ...date, fromISO, toISO });
    }
  };

  const handleCustomDateChange = (value: { from?: Date; to?: Date } | undefined) => {
    // Safely handle potentially undefined value
    if (!value) {
      console.log("📅 Custom date selection cleared or undefined");
      return;
    }
    
    // Verificar si es redundante con la selección actual
    if (value.from && date.from && value.to && date.to) {
      if (isEqual(value.from, date.from) && isEqual(value.to, date.to)) {
        console.log("📅 Custom date selection unchanged, ignoring");
        return;
      }
    }

    console.log("📅 Custom date selection changed:", value);
    setDate({
      from: value.from || undefined,
      to: value.to || undefined
    });

    // Only trigger the callback if we have both from and to dates
    if (value.from && value.to) {
      setSelectedRange("custom");
      lastRange.current = "custom";
      
      // Add ISO formatted dates
      const fromISO = value.from ? formatDateToISO(value.from) : undefined;
      const toISO = value.to ? formatDateToISO(value.to, true) : undefined; // End of day for the to-date
      
      // Verificar si es redundante con la última selección
      if (fromISO === lastFromISO.current && toISO === lastToISO.current) {
        console.log("📅 DateRangePicker: Ignorando cambio de fecha personalizada redundante");
        return;
      }
      
      lastFromISO.current = fromISO || null;
      lastToISO.current = toISO || null;
      
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
  };

  // Initialize with the default date range on mount, evitando múltiples triggers
  useEffect(() => {
    if (!isInitialized.current) {
      console.log("📅 DateRangePicker initialized with default range:", selectedRange);
      handleRangeChange(selectedRange);
      isInitialized.current = true;
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
