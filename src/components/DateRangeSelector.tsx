
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (value: string) => void;
}

const DateRangeSelector = ({ selectedRange, onRangeChange }: DateRangeSelectorProps) => {
  return (
    <Select value={selectedRange} onValueChange={onRangeChange}>
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
  );
};

export default DateRangeSelector;
