import React from 'react';

interface KpiCardProps {
  titulo: string;
  monto: number;
  icono?: React.ReactNode;
  tipoColor: 'verde' | 'rojo' | 'azul' | 'neutro';
}

export default function KpiCard({ titulo, monto, icono, tipoColor }: KpiCardProps) {
  const colorMap = {
    verde: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30',
    },
    rojo: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/30',
    },
    azul: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/30',
    },
    neutro: {
      bg: 'bg-slate-50 dark:bg-slate-900/20',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-100 dark:border-slate-900/30',
    },
  };

  const colors = colorMap[tipoColor] || colorMap.neutro;

  const formattedMonto = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(monto);

  return (
    <div className={`p-6 rounded-2xl border ${colors.border} ${colors.bg} shadow-sm transition-all duration-300 hover:shadow-md flex items-center justify-between`}>
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {titulo}
        </span>
        <h3 className={`text-3xl font-bold tracking-tight ${colors.text}`}>
          {formattedMonto}
        </h3>
      </div>
      {icono && (
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} border ${colors.border}`}>
          {icono}
        </div>
      )}
    </div>
  );
}
