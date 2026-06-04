import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerFieldProps {
  value?: string; // ISO yyyy-mm-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
}: DatePickerFieldProps) {
  const date = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "dd MMM yyyy", { locale: localeId }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(d.toISOString().slice(0, 10))}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
