"use client";

import { useState, useRef, useEffect } from "react";

const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

interface DatePickerProps {
  value: string;           // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
}

function parseLocal(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmt(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function displayFmt(str: string) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

export default function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa", label }: DatePickerProps) {
  const today = new Date();
  const selected = parseLocal(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((selected || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected || today).getMonth());

  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Actualizar vista cuando cambia el valor externo
  useEffect(() => {
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const days: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (days.length % 7 !== 0) days.push(null);

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = (d: number) =>
    selected && d === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();

  const select = (d: number) => {
    onChange(fmt(new Date(viewYear, viewMonth, d)));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>}

      {/* Input */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-left transition-colors hover:border-gray-400 focus:outline-none"
        style={{ borderColor: open ? "var(--utn-red)" : undefined,
                 boxShadow: open ? "0 0 0 3px rgba(185,28,28,0.1)" : undefined }}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>{value ? displayFmt(value) : placeholder}</span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-72 right-0">

          {/* Navegación mes */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
              </svg>
            </button>

            <span className="text-sm font-semibold text-gray-800">
              {MESES[viewMonth]} {viewYear}
            </span>

            <button type="button" onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Cuadrícula */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const sel = isSelected(d);
              const tod = isToday(d);
              return (
                <button
                  key={`${viewYear}-${viewMonth}-${d}`}
                  type="button"
                  onClick={() => select(d)}
                  className="h-8 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all"
                  style={
                    sel
                      ? { background: "var(--utn-red)", color: "#fff" }
                      : tod
                      ? { border: "2px solid var(--utn-red)", color: "var(--utn-red)" }
                      : {}
                  }
                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "#F5F5F5"; }}
                  onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Pie */}
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Borrar
            </button>
            <button type="button" onClick={() => { onChange(fmt(today)); setOpen(false); }}
              className="text-xs font-semibold transition-colors" style={{ color: "var(--utn-red)" }}>
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
