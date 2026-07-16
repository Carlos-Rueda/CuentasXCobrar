"use client";

import { ArrowUp, ArrowDown, ArrowUpDown, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Paleta y clases base compartidas (equivalente a "variables Bootstrap")
//   primary  → blue-600   (botones de acción, enlaces, orden activo)
//   success  → emerald-600 (cobrado / pagado / saldado)
//   danger   → red-600     (deuda / eliminar / error)
//   warning  → amber-500   (parcial / pendiente)
//   neutral  → slate-*     (texto, bordes, fondos)
// ─────────────────────────────────────────────────────────────────────────

// Tipos de pago que puede recibir una cuenta bancaria de la empresa.
// Se usan tanto al crear/editar una cuenta bancaria como al registrar un
// cobro: el tipo de pago elegido determina qué cuentas bancarias se ofrecen.
export const TIPOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta", "Cheque"] as const;
export type TipoPago = (typeof TIPOS_PAGO)[number];

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export const labelClass = "block text-xs font-medium text-slate-500 mb-1.5";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const dangerButton =
  "inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const ghostIconButton =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors";

export const thBase =
  "px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider whitespace-nowrap";

export const thSortable = `${thBase} cursor-pointer select-none hover:text-slate-700 transition-colors`;

export const tdBase = "px-5 py-3";

// ── Título de página ────────────────────────────────────────────────────
export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Tarjetas de métricas ─────────────────────────────────────────────────
export type Metric = { label: string; value: string | number; color?: string };

export function MetricsRow({ items }: { items: Metric[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {items.map(({ label, value, color = "text-slate-800" }) => (
        <div key={label} className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className={`text-xl font-semibold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Badge de estado ──────────────────────────────────────────────────────
const BADGE_COLORS = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-100 text-blue-700",
} as const;

export function Badge({
  color,
  children,
}: {
  color: keyof typeof BADGE_COLORS;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_COLORS[color]}`}
    >
      {children}
    </span>
  );
}

// ── Icono de orden de columna ────────────────────────────────────────────
export function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="inline ml-1 w-3.5 h-3.5 text-slate-300" />;
  return dir === "asc" ? (
    <ArrowUp className="inline ml-1 w-3.5 h-3.5 text-blue-500" />
  ) : (
    <ArrowDown className="inline ml-1 w-3.5 h-3.5 text-blue-500" />
  );
}

// ── Tarjeta contenedora de tabla ─────────────────────────────────────────
export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-slate-400 text-sm">
        {message}
      </td>
    </tr>
  );
}

// ── Barra de filtros ─────────────────────────────────────────────────────
export function FilterBar({
  children,
  onSearch,
  onClear,
}: {
  children: React.ReactNode;
  onSearch: () => void;
  onClear: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xs font-semibold text-slate-400 tracking-widest mb-4 uppercase">
        Filtros de búsqueda
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">{children}</div>
      <div className="flex gap-2">
        <button type="button" onClick={onSearch} className={primaryButton}>
          Buscar
        </button>
        <button type="button" onClick={onClear} className={secondaryButton}>
          Limpiar
        </button>
      </div>
    </div>
  );
}

// ── Paginación ───────────────────────────────────────────────────────────
export function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onChange: (page: number) => void;
}) {
  if (totalItems === 0) return null;
  const from = Math.min((page - 1) * perPage + 1, totalItems);
  const to = Math.min(page * perPage, totalItems);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-500">
        Mostrando {from}–{to} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              p === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Modal genérico ───────────────────────────────────────────────────────
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = "max-w-lg",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 w-full ${maxWidth} mx-4 overflow-hidden`}>
        <div className="bg-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              {subtitle && <p className="text-sm text-blue-100 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          {footer}
        </div>
      </div>
    </div>
  );
}
