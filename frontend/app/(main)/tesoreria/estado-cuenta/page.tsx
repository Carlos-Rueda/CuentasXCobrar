"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/app/config";
import { useToast } from "@/app/components/toast";
import { PageTitle, thBase, tdBase } from "@/app/components/ui";
import { Landmark, ArrowUpRight, RefreshCw, ChevronDown, ChevronUp, Calendar, ArrowUpCircle, ArrowDownCircle, Info } from "lucide-react";

interface Transaccion {
  id: string;
  fecha: string;
  tipo: "ingreso" | "egreso";
  referencia: string;
  descripcion: string;
  monto: number;
}

interface EstadoCuentaReport {
  cuentaId: string;
  nombreBanco: string;
  numeroCuenta: string;
  saldo_cxc: number;
  saldo_facturacion: number;
  saldo_total: number;
  transacciones?: Transaccion[];
}

export default function EstadoCuentaPage() {
  const { showToast } = useToast();
  const [reportes, setReportes] = useState<EstadoCuentaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCuentas, setExpandedCuentas] = useState<Record<string, boolean>>({});

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const token = sessionStorage.getItem("auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/dashboard/estado-cuenta/detalle`, {
        headers,
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setReportes(data);
      } else {
        showToast("Error al cargar el reporte de estado de cuenta", "error");
      }
    } catch (error) {
      console.error("Error al cargar reporte:", error);
      showToast("Error de conexión al cargar el reporte", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const toggleExpand = (cuentaId: string) => {
    setExpandedCuentas((prev) => ({
      ...prev,
      [cuentaId]: !prev[cuentaId],
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* ── Cabecera ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageTitle
          title="Estado de Cuenta Consolidado"
          subtitle="Reporte detallado que consolida los fondos locales (CXC, transferencias y egresos) con los de facturación externa."
        />
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Recargar Datos
        </button>
      </div>

      {/* ── Resumen General del Sistema ── */}
      {!loading && reportes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Consolidado CXC (Interno)",
              value: reportes.reduce((sum, r) => sum + r.saldo_cxc, 0),
              color: "text-slate-800",
            },
            {
              label: "Consolidado Facturación (Externo)",
              value: reportes.reduce((sum, r) => sum + r.saldo_facturacion, 0),
              color: "text-emerald-600",
            },
            {
              label: "Total Fondos Disponibles",
              value: reportes.reduce((sum, r) => sum + r.saldo_total, 0),
              color: "text-[var(--utn-red)]",
            },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className={`text-2xl font-black mt-1.5 ${card.color}`}>{formatCurrency(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabla Principal ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--utn-red)] border-t-transparent mb-4"></div>
          <p className="text-slate-500 text-sm">Cargando reporte de estado de cuenta...</p>
        </div>
      ) : reportes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
          <Landmark className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-medium">No se encontraron cuentas bancarias activas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className={`${thBase} w-10`}></th>
                  <th className={thBase}>Cuenta Bancaria (Banco / Número)</th>
                  <th className={`${thBase} text-right`}>Disponible CXC (Local)</th>
                  <th className={`${thBase} text-right`}>Disponible Facturación (Externo)</th>
                  <th className={`${thBase} text-right`}>Total Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reportes.map((rep) => {
                  const isExpanded = !!expandedCuentas[rep.cuentaId];
                  return (
                    <React.Fragment key={rep.cuentaId}>
                      {/* Fila Principal */}
                      <tr 
                        onClick={() => toggleExpand(rep.cuentaId)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 text-center">
                          <button className="text-slate-400 hover:text-slate-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className={tdBase}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[var(--utn-red)] flex-shrink-0">
                              <Landmark className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{rep.nombreBanco}</p>
                              <p className="text-xs text-slate-400">N° {rep.numeroCuenta}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`${tdBase} text-right font-semibold text-slate-700`}>
                          {formatCurrency(rep.saldo_cxc)}
                        </td>
                        <td className={`${tdBase} text-right font-semibold text-emerald-600`}>
                          {formatCurrency(rep.saldo_facturacion)}
                        </td>
                        <td className={`${tdBase} text-right`}>
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <span className="font-extrabold text-slate-900">{formatCurrency(rep.saldo_total)}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                          </div>
                        </td>
                      </tr>

                      {/* Fila Detalle (Desplegable) */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50/70 px-8 py-5 border-t border-b border-slate-100">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                  <Info className="w-4 h-4 text-slate-400" />
                                  Historial de Transacciones de Cuenta (CXC e Internos)
                                </h3>
                                <span className="text-[10px] bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                  {rep.transacciones?.length || 0} movimientos
                                </span>
                              </div>

                              {(!rep.transacciones || rep.transacciones.length === 0) ? (
                                <div className="text-center p-6 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                                  No hay transacciones locales registradas para esta cuenta.
                                </div>
                              ) : (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                                    <thead className="bg-slate-50/50 text-slate-400 font-semibold text-left">
                                      <tr>
                                        <th className="px-4 py-2">Fecha</th>
                                        <th className="px-4 py-2">Referencia</th>
                                        <th className="px-4 py-2">Descripción</th>
                                        <th className="px-4 py-2 text-right">Monto</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                                      {rep.transacciones.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                                          <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                              <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                              {new Date(t.fecha).toLocaleDateString()}
                                            </div>
                                          </td>
                                          <td className="px-4 py-2.5 font-bold text-slate-700 whitespace-nowrap">
                                            <span className="flex items-center gap-1.5">
                                              {t.tipo === "ingreso" ? (
                                                <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
                                              ) : (
                                                <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
                                              )}
                                              {t.referencia}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 max-w-xs truncate text-slate-500">
                                            {t.descripcion}
                                          </td>
                                          <td className={`px-4 py-2.5 text-right font-bold ${
                                            t.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"
                                          }`}>
                                            {t.tipo === "ingreso" ? "+" : "-"}
                                            {formatCurrency(t.monto)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// React.Fragment helper
import React from "react";
