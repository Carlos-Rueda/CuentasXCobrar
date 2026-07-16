"use client";

import { useEffect, useState } from 'react';
import { API_URL } from '@/app/config';
import KpiCard from './components/KpiCard';

interface ResumenKpis {
  total_ingresos: number;
  total_egresos: number;
  saldo_consolidado: number;
}

export default function DashboardTesoreriaPage() {
  const [kpis, setKpis] = useState<ResumenKpis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKpis() {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('auth_token') || 
                      sessionStorage.getItem('access_token') ||
                      localStorage.getItem('token') ||
                      localStorage.getItem('auth_token');
        const headers: HeadersInit = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/movimientos/resumen`, {
          headers,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Error al cargar el resumen de KPIs del dashboard');
        }

        const data = await response.json();
        setKpis(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    }

    fetchKpis();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Dashboard de Tesorería
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visualiza el flujo de caja, ingresos, egresos y el saldo consolidado de la empresa.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/10 animate-pulse space-y-4">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-8 w-48 bg-slate-300 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 text-sm">
          {error}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard
            titulo="Total Ingresos"
            monto={kpis.total_ingresos}
            tipoColor="verde"
            icono={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <KpiCard
            titulo="Total Egresos"
            monto={kpis.total_egresos}
            tipoColor="rojo"
            icono={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
            }
          />
          <KpiCard
            titulo="Saldo Consolidado"
            monto={kpis.saldo_consolidado}
            tipoColor={kpis.saldo_consolidado >= 0 ? 'azul' : 'rojo'}
            icono={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
