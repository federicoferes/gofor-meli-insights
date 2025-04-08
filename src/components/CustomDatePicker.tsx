
import React from 'react';
import { format } from "date-fns";
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
import { DateRange } from "@/types/meli";

interface CustomDatePickerProps {
  date: { from: Date | undefined; to: Date | undefined };
  onCustomDateChange: (value: { from?: Date; to?: Date } | undefined) => void;
}

const CustomDatePicker = ({ date, onCustomDateChange }: CustomDatePickerProps) => {
  return (
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
          onSelect={onCustomDateChange}
          numberOfMonths={2}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default CustomDatePicker;
