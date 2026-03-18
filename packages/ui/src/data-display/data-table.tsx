"use client";

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T>({
  columns, data, keyExtractor, sortBy, sortOrder,
  onSort, onRowClick, emptyMessage = "No items found", loading,
}: DataTableProps<T>) {
  if (loading) {
    return <div className="np-table-loading">Loading...</div>;
  }

  return (
    <div className="np-table-wrapper overflow-x-auto">
      <table className="np-table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`np-th ${col.className ?? ""} ${col.sortable ? "cursor-pointer select-none" : ""}`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                {col.header}
                {col.sortable && sortBy === col.key && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="np-td text-center py-8 text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`np-td ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
