import type { ReactNode } from 'react';
import { Spinner } from './spinner';
import { EmptyState } from './empty-state';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found',
  keyExtractor,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-border bg-card ${className}`}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted text-overline text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="transition-colors duration-fast hover:bg-muted">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
