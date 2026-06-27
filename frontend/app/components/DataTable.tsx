"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

// ── Tipos ────────────────────────────────────────────────────────────────────

export type SortDir = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  searchKeys?: (keyof T)[];
  pageOptions?: number[];
  onDownload?: () => void;
  onFilteredChange?: (filtered: T[]) => void;
  emptyMessage?: string;
}

// ── Ícono de orden ───────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 opacity-60">
      <svg
        className={`w-2.5 h-2.5 -mb-0.5 ${dir === "asc" ? "opacity-100 text-red-700" : "opacity-40"}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg
        className={`w-2.5 h-2.5 ${dir === "desc" ? "opacity-100 text-red-700" : "opacity-40"}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  searchKeys = [],
  pageOptions = [5, 10, 25, 50],
  onDownload,
  onFilteredChange,
  emptyMessage = "No hay registros disponibles.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(pageOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── Buscar ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const term = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) =>
        String(row[k] ?? "").toLowerCase().includes(term),
      ),
    );
  }, [data, search, searchKeys]);

  // Notificar al padre cuáles son los datos filtrados actualmente
  useEffect(() => {
    onFilteredChange?.(filtered);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  // ── Ordenar ─────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      const numA = Number(a[sortKey]);
      const numB = Number(b[sortKey]);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Paginar ─────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageData = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const from = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, sorted.length);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey !== key) {
        setSortKey(key);
        setSortDir("asc");
      } else if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir(null);
      }
      setCurrentPage(1);
    },
    [sortKey, sortDir],
  );

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handlePageSize = (val: number) => {
    setPageSize(val);
    setCurrentPage(1);
  };

  // ── Páginas a mostrar ────────────────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (safePage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  }, [totalPages, safePage]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── Controles superiores ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            {pageOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span>registros</span>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar
            </button>
          )}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
            </svg>
            <input
              type="search"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 w-52"
            />
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-6 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap select-none ${col.sortable ? "cursor-pointer hover:bg-gray-200 transition-colors" : ""} ${col.className ?? ""}`}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable && (
                      <SortIcon dir={sortKey === col.key ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-sm text-gray-700 ${col.className ?? ""}`}
                    >
                      {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pie de tabla ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {sorted.length === 0
            ? "No hay registros"
            : `Mostrando ${from} a ${to} de ${sorted.length} registros`}
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>

          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-500">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(Number(p))}
                className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                  safePage === p
                    ? "bg-red-700 text-white border-red-700"
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper: badge de estado ───────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  activo:       "bg-green-100 text-green-800",
  ACTIVO:       "bg-green-100 text-green-800",
  pagado:       "bg-green-100 text-green-800",
  PAGADO:       "bg-green-100 text-green-800",
  impreso:      "bg-blue-100 text-blue-800",
  IMPRESO:      "bg-blue-100 text-blue-800",
  inactivo:     "bg-red-100 text-red-800",
  INACTIVO:     "bg-red-100 text-red-800",
  pendiente:    "bg-yellow-100 text-yellow-800",
  PENDIENTE:    "bg-yellow-100 text-yellow-800",
  parcial:      "bg-yellow-100 text-yellow-800",
  PARCIAL:      "bg-yellow-100 text-yellow-800",
  "por pagar":  "bg-red-100 text-red-800",
  "POR PAGAR":  "bg-red-100 text-red-800",
};

export function StatusBadge({ value }: { value: string }) {
  const style = STATUS_STYLES[value] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {value}
    </span>
  );
}
