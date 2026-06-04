import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "info" | "danger";
  className?: string;
}

const toneBg: Record<NonNullable<SummaryCardProps["tone"]>, string> = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  info: "bg-info/12 text-info",
  danger: "bg-destructive/12 text-destructive",
};

export function SummaryCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn("flex items-start justify-between gap-3 p-5", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1.5 truncate font-display text-2xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", toneBg[tone])}>
        <Icon className="size-5" />
      </div>
    </Card>
  );
}
