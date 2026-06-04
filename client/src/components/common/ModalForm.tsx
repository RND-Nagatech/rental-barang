import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClass: Record<NonNullable<ModalFormProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function ModalForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  footer,
  size = "md",
}: ModalFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClass[size]} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-1">{children}</div>

        {footer ?? (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            {onSubmit && <Button onClick={onSubmit}>{submitLabel}</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
