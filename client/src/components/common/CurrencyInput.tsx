import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  id,
  disabled,
}: CurrencyInputProps) {
  const display = value ? new Intl.NumberFormat("id-ID").format(value) : "";

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        Rp
      </span>
      <Input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        value={display}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(digits ? parseInt(digits, 10) : 0);
        }}
        className="pl-9"
      />
    </div>
  );
}
