
import React, { useState, useEffect, useRef } from 'react';
import { isEqual } from "date-fns";
import { DateRange } from "@/types/meli";
import { getPresetDateRange } from "@/utils/date";
import { 
  handleDateRangeSelection,
  handleCustomDateSelection
} from "@/utils/datePickerUtils";
import DateRangeSelector from "@/components/DateRangeSelector";
import CustomDatePicker from "@/components/CustomDatePicker";

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
  
  const isInitialized = useRef(false);
  const lastRange = useRef<string | null>(null);
  const lastFromISO = useRef<string | null>(null);
  const lastToISO = useRef<string | null>(null);

  const handleRangeChange = (value: string) => {
    handleDateRangeSelection(
      value,
      date,
      onDateRangeChange,
      lastRange,
      lastFromISO,
      lastToISO
    );

    if (value !== "custom") {
      setDate(getPresetDateRange(value));
    }
  };

  const handleCustomDateChange = (value: { from?: Date; to?: Date } | undefined) => {
    handleCustomDateSelection(
      value,
      date,
      setDate,
      setSelectedRange,
      onDateRangeChange,
      lastRange,
      lastFromISO,
      lastToISO
    );
  };

  useEffect(() => {
    if (!isInitialized.current) {
      console.log("📅 DateRangePicker initialized with default range:", selectedRange);
      handleRangeChange(selectedRange);
      isInitialized.current = true;
    }
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <DateRangeSelector 
        selectedRange={selectedRange} 
        onRangeChange={handleRangeChange} 
      />

      {selectedRange === "custom" && (
        <CustomDatePicker 
          date={date} 
          onCustomDateChange={handleCustomDateChange} 
        />
      )}
    </div>
  );
};

export default DateRangePicker;
