import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="font-display">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t px-6 py-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
