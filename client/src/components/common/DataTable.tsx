import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  searchable = true,
  searchKeys,
  searchPlaceholder = "Cari...",
  rowKey,
  onRowClick,
  toolbar,
  emptyMessage = "Tidak ada data.",
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    const keys = searchKeys ?? (Object.keys(data[0] ?? {}) as (keyof T)[]);
    return data.filter((row) =>
      keys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)),
    );
  }, [data, query, searchKeys]);

  return (
    <div className="space-y-3">
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col.key} className={cn("whitespace-nowrap", col.headClassName)}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && "cursor-pointer")}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render ? col.render(row) : (row as Record<string, React.ReactNode>)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
