"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/app/config";
import { useToast } from "@/app/components/toast";
import { PageTitle } from "@/app/components/ui";
import DatePicker from "@/app/components/DatePicker";
import { 
  Landmark, 
  RefreshCw, 
  Calendar, 
  CreditCard, 
  Repeat, 
  DollarSign, 
  Receipt, 
  Activity,
  ArrowUpRight,
  Filter,
  X,
  FileText,
  ShoppingCart
} from "lucide-react";

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
  nombreCuenta?: string;
  tipoCuenta?: string;
  saldo_cxc: number;
  saldo_facturacion: number;
  saldo_total: number;
  transferencias: Transaccion[];
  pagosExternos: Transaccion[];
  pagosRecaudadosCxc: Transaccion[];
  ingresosManuales?: Transaccion[];
  comprasEgresos?: Transaccion[];
}

type TabType = "all" | "transfers" | "expenses" | "cxc" | "billing" | "purchases";

export default function EstadoCuentaPage() {
  const { showToast } = useToast();
  const [reportes, setReportes] = useState<EstadoCuentaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuentaId, setSelectedCuentaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Filtros de fechas locales (aplican solo a la cuenta seleccionada)
  const [localFechaInicio, setLocalFechaInicio] = useState<string>("");
  const [localFechaFin, setLocalFechaFin] = useState<string>("");

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
        if (data.length > 0) {
          setSelectedCuentaId(data[0].cuentaId);
        }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Helper para filtrar transacciones por rango de fechas
  const filtrarTransaccionesPorRango = (items: Transaccion[], inicio: string, fin: string) => {
    if (!items) return [];
    return items.filter((t) => {
      if (!t.fecha) return true;
      const tDate = new Date(t.fecha);
      if (inicio) {
        const start = new Date(inicio);
        start.setHours(0, 0, 0, 0);
        if (tDate < start) return false;
      }
      if (fin) {
        const end = new Date(fin);
        end.setHours(23, 59, 59, 999);
        if (tDate > end) return false;
      }
      return true;
    });
  };

  const selectedReport = reportes.find((r) => r.cuentaId === selectedCuentaId);

  // Mapear transacciones filtradas para el panel de detalle usando los filtros locales
  const transferenciasFiltradas = selectedReport ? filtrarTransaccionesPorRango(selectedReport.transferencias, localFechaInicio, localFechaFin) : [];
  const pagosExternosFiltrados = selectedReport ? filtrarTransaccionesPorRango(selectedReport.pagosExternos, localFechaInicio, localFechaFin) : [];
  const pagosRecaudadosCxcFiltradas = selectedReport ? filtrarTransaccionesPorRango(selectedReport.pagosRecaudadosCxc, localFechaInicio, localFechaFin) : [];
  const ingresosManualesFiltrados = selectedReport ? filtrarTransaccionesPorRango(selectedReport.ingresosManuales || [], localFechaInicio, localFechaFin) : [];
  const comprasFiltradas = selectedReport ? filtrarTransaccionesPorRango(selectedReport.comprasEgresos || [], localFechaInicio, localFechaFin) : [];

  // Combinación de todos los movimientos para la vista consolidada
  const todosLosMovimientos = [
    ...transferenciasFiltradas.map(t => ({ ...t, origen: "Transferencia" })),
    ...pagosExternosFiltrados.map(t => ({ ...t, origen: "Pago Externo" })),
    ...pagosRecaudadosCxcFiltradas.map(t => ({ ...t, origen: "Recaudación CXC" })),
    ...ingresosManualesFiltrados.map(t => ({ ...t, origen: "Ingreso Manual" })),
    ...comprasFiltradas.map(t => ({ ...t, origen: "Pago Compra" }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Flujos de efectivo del período de la cuenta seleccionada
  const totalIngresos = 
    pagosRecaudadosCxcFiltradas.reduce((sum, t) => sum + t.monto, 0) +
    ingresosManualesFiltrados.reduce((sum, t) => sum + t.monto, 0) +
    transferenciasFiltradas.filter(t => t.referencia.includes("Recibida")).reduce((sum, t) => sum + t.monto, 0);

  const totalEgresos = 
    pagosExternosFiltrados.reduce((sum, t) => sum + t.monto, 0) +
    comprasFiltradas.reduce((sum, t) => sum + t.monto, 0) +
    transferenciasFiltradas.filter(t => t.referencia.includes("Enviada")).reduce((sum, t) => sum + t.monto, 0);

  const flujoNeto = totalIngresos - totalEgresos;

  // Sumas de desglose
  const sumRecaudadoCxc = pagosRecaudadosCxcFiltradas.reduce((sum, t) => sum + t.monto, 0);
  const sumTransfRecibidas = transferenciasFiltradas.filter(t => t.referencia.includes("Recibida")).reduce((sum, t) => sum + t.monto, 0);
  const sumTransfEnviadas = transferenciasFiltradas.filter(t => t.referencia.includes("Enviada")).reduce((sum, t) => sum + t.monto, 0);
  const sumPagosExternos = pagosExternosFiltrados.reduce((sum, t) => sum + t.monto, 0);
  const sumComprasEgresos = comprasFiltradas.reduce((sum, t) => sum + t.monto, 0);

  // Función para exportar la cuenta seleccionada a un CSV estructurado y compatible con Excel
  const exportarAExcel = () => {
    if (!selectedReport) return;

    const banco = selectedReport.nombreBanco;
    const nroCuenta = selectedReport.numeroCuenta;
    const titular = selectedReport.nombreCuenta || "UTN Principal";
    const tipo = selectedReport.tipoCuenta || "Ahorros";
    const periodo = localFechaInicio || localFechaFin
      ? `${localFechaInicio || "Inicio"} al ${localFechaFin || "Fin"}`
      : "Histórico Completo";

    // Construcción del contenido del CSV
    // Usamos sep=; al inicio para que Excel lo abra directamente en columnas
    let csvContent = "sep=;\n";
    csvContent += "REPORTE DE ESTADO DE CUENTA BANCARIO\n";
    csvContent += `Banco:;${banco}\n`;
    csvContent += `Número de Cuenta:;${nroCuenta}\n`;
    csvContent += `Titular:;${titular}\n`;
    csvContent += `Tipo de Cuenta:;${tipo}\n`;
    csvContent += `Período:;${periodo}\n\n`;

    csvContent += "RESUMEN FINANCIERO\n";
    csvContent += "Concepto;Monto\n";
    csvContent += `Facturación Externa;${selectedReport.saldo_facturacion.toFixed(2)}\n`;
    csvContent += `Pagos Recaudados (CXC);${sumRecaudadoCxc.toFixed(2)}\n`;
    csvContent += `Transferencias Recibidas;${sumTransfRecibidas.toFixed(2)}\n`;
    csvContent += `Transferencias Enviadas;${sumTransfEnviadas.toFixed(2)}\n`;
    csvContent += `Pagos Externos (Egresos);${sumPagosExternos.toFixed(2)}\n`;
    csvContent += `Pagos de Compras (Modulo Externo);${sumComprasEgresos.toFixed(2)}\n`;
    csvContent += `Saldo Consolidado Total;${selectedReport.saldo_total.toFixed(2)}\n\n`;

    csvContent += "DETALLE DE MOVIMIENTOS\n";
    csvContent += "Fecha;Concepto;Referencia;Descripción;Monto\n";

    todosLosMovimientos.forEach((t) => {
      const fechaFormateada = new Date(t.fecha).toLocaleDateString();
      const refLimpia = (t.referencia || "").replace(/;/g, ",").replace(/\n/g, " ");
      const descLimpia = (t.descripcion || "").replace(/;/g, ",").replace(/\n/g, " ");
      const montoFormateado = t.monto.toFixed(2);
      csvContent += `${fechaFormateada};${t.origen};${refLimpia};${descLimpia};${montoFormateado}\n`;
    });

    // Agregar UTF-8 BOM para soporte correcto de acentos y caracteres especiales en Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const nombreArchivo = `Estado_Cuenta_${banco.replace(/\s+/g, "_")}_${localFechaInicio || "historico"}_${localFechaFin || "actual"}.csv`;
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Reporte CSV descargado exitosamente", "success");
  };

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6">
      {/* ── Cabecera ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageTitle
          title="Estado de Cuenta Consolidado"
          subtitle="Consulta balances, transacciones y cobros integrados de manera ágil y visual."
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

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--utn-red)] border-t-transparent mb-4"></div>
          <p className="text-slate-500 text-sm">Cargando cuentas...</p>
        </div>
      ) : reportes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
          <Landmark className="w-12 h-12 mx-auto text-slate-350 mb-3" />
          <p className="font-medium">No se encontraron cuentas bancarias activas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LISTADO IZQUIERDO: Cuentas Bancarias ── */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider px-1">Tus Cuentas Bancarias</h3>
            <div className="space-y-3">
              {reportes.map((rep) => {
                const isSelected = rep.cuentaId === selectedCuentaId;
                return (
                  <div
                    key={rep.cuentaId}
                    onClick={() => {
                      setSelectedCuentaId(rep.cuentaId);
                      setActiveTab("all");
                      setLocalFechaInicio("");
                      setLocalFechaFin("");
                    }}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative overflow-hidden flex flex-col justify-between h-36 shadow-xs ${
                      isSelected
                        ? "border-[var(--utn-red)] bg-red-50/15 text-slate-800 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm text-slate-855"
                    }`}
                  >
                    <div className="flex items-start justify-between z-10">
                      <div>
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-extrabold tracking-wider ${
                          isSelected ? "bg-red-105 text-[var(--utn-red)]" : "bg-slate-100 text-slate-500"
                        }`}>
                          {rep.tipoCuenta || "Ahorros"}
                        </span>
                        <h4 className="font-black text-base mt-1.5 tracking-tight">{rep.nombreBanco}</h4>
                        <p className="text-[10px] text-slate-400">
                          N° {rep.numeroCuenta}
                        </p>
                      </div>
                      <Landmark className={`w-7 h-7 ${isSelected ? "text-[var(--utn-red)]" : "text-slate-300"}`} />
                    </div>

                    <div className="mt-2 flex items-baseline justify-between z-10 border-t border-slate-200/50 pt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                        Saldo Consolidado
                      </span>
                      <span className={`text-lg font-black ${isSelected ? "text-[var(--utn-red)]" : "text-slate-800"}`}>
                        {formatCurrency(rep.saldo_total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── DETALLE DERECHO: Dashboard de la Cuenta Seleccionada ── */}
          <div className="lg:col-span-8 space-y-6">
            {selectedReport ? (
              <div className="space-y-6">
                
                {/* ── Ficha del Balance & Filtros Locales ── */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Panel de Control</span>
                      <h2 className="text-2xl font-black text-slate-855 mt-0.5">{selectedReport.nombreBanco}</h2>
                      <p className="text-xs text-slate-550 mt-0.5">
                        Titular: <span className="font-semibold text-slate-655">{selectedReport.nombreCuenta || "UTN Principal"}</span> — Tipo: <span className="font-semibold text-slate-655 capitalize">{selectedReport.tipoCuenta || "Ahorros"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Filtro de Fecha Local */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-[var(--utn-red)]" />
                      Filtro por Rango de Fechas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-1">
                        <DatePicker
                          label="Fecha de Inicio"
                          value={localFechaInicio}
                          onChange={(v) => setLocalFechaInicio(v)}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <DatePicker
                          label="Fecha de Fin"
                          value={localFechaFin}
                          onChange={(v) => setLocalFechaFin(v)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setLocalFechaInicio(""); setLocalFechaFin(""); }}
                        disabled={!localFechaInicio && !localFechaFin}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-[var(--utn-red)] text-sm font-semibold hover:bg-red-105 transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full"
                      >
                        <X className="w-4 h-4" />
                        Limpiar
                      </button>
                       <button
                        type="button"
                        onClick={exportarAExcel}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors w-full"
                      >
                        <FileText className="w-4 h-4" />
                        Exportar CSV (Excel)
                      </button>
                    </div>
                  </div>

                  {/* Resumen de KPI Cards del Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Facturación Externo</span>
                      <p className="text-lg font-black text-emerald-755 mt-2">{formatCurrency(selectedReport.saldo_facturacion)}</p>
                    </div>
                    
                    {/* Flujo Neto del Período / Saldo Consolidado */}
                    {(localFechaInicio || localFechaFin) ? (
                      <div className={`border rounded-2xl p-4 flex flex-col justify-between ${
                        flujoNeto >= 0 
                          ? "bg-emerald-55/40 border-emerald-100 text-emerald-800" 
                          : "bg-red-55/40 border-red-100 text-[var(--utn-red)]"
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {flujoNeto >= 0 ? "Flujo Neto (Entrada)" : "Flujo Neto (Salida)"}
                        </span>
                        <p className="text-lg font-black mt-2">
                          {formatCurrency(Math.abs(flujoNeto))}
                        </p>
                        <span className="text-[9px] text-slate-400 mt-1">Total Histórico: {formatCurrency(selectedReport.saldo_total)}</span>
                      </div>
                    ) : (
                      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-[var(--utn-red)] uppercase tracking-wider">Total Consolidado</span>
                        <p className="text-xl font-black text-[var(--utn-red)] mt-2 flex items-center gap-1">
                          {formatCurrency(selectedReport.saldo_total)}
                          <ArrowUpRight className="w-4 h-4 text-[var(--utn-red)]" />
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Desglose de Fondos de Movimientos */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border-t border-slate-100 pt-6">
                    <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3.5">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Pagos Recaudados</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{formatCurrency(sumRecaudadoCxc)}</p>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3.5">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Transf. Recibidas</span>
                      <p className="text-sm font-black text-emerald-655 mt-1">{formatCurrency(sumTransfRecibidas)}</p>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3.5">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Transf. Enviadas</span>
                      <p className="text-sm font-black text-[var(--utn-red)] mt-1">{formatCurrency(sumTransfEnviadas)}</p>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3.5">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Pagos Externos</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{formatCurrency(sumPagosExternos)}</p>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3.5">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Pagos Compras</span>
                      <p className="text-sm font-black text-[var(--utn-red)] mt-1">{formatCurrency(sumComprasEgresos)}</p>
                    </div>
                  </div>
                </div>

                {/* ── Navegación por Conceptos (Tabs UX) ── */}
                <div className="bg-slate-100/80 border border-slate-200/50 p-1.5 rounded-2xl flex flex-wrap gap-1">
                  {[
                    { id: "all", label: "Todos", icon: Activity },
                    { id: "transfers", label: "Transacciones Internas", icon: Repeat },
                    { id: "expenses", label: "Pagos Externos", icon: DollarSign },
                    { id: "purchases", label: "Pagos Compras", icon: ShoppingCart },
                    { id: "cxc", label: "Cobros CXC", icon: Receipt },
                    { id: "billing", label: "Cobros Facturación", icon: Landmark }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[var(--utn-red)] text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── Listas de Transacciones según el Tab Activo ── */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                  
                  {/* TAB: Todos */}
                  {activeTab === "all" && (
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Historial Consolidado del Período</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {todosLosMovimientos.length} registros
                        </span>
                      </div>

                      {todosLosMovimientos.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">Sin registros en el rango seleccionado.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-550 font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3 rounded-l-xl">Fecha</th>
                                <th className="px-4 py-3">Concepto</th>
                                <th className="px-4 py-3">Detalle / Referencia</th>
                                <th className="px-4 py-3 text-right rounded-r-xl">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {todosLosMovimientos.map((t) => {
                                const isIncome = t.tipo === "ingreso" || t.referencia.includes("Recibida");
                                return (
                                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                                      {new Date(t.fecha).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                        isIncome ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-[var(--utn-red)]"
                                      }`}>
                                        {t.origen}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <div className="font-bold text-slate-800">{t.referencia}</div>
                                      <div className="text-[10px] text-slate-450 max-w-xs truncate">{t.descripcion}</div>
                                    </td>
                                    <td className={`px-4 py-3.5 text-right font-black text-sm ${
                                      isIncome ? "text-emerald-655" : "text-slate-855"
                                    }`}>
                                      {formatCurrency(t.monto)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Transacciones Internas */}
                  {activeTab === "transfers" && (
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Transferencias entre Cuentas</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {transferenciasFiltradas.length} operaciones
                        </span>
                      </div>

                      {transferenciasFiltradas.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">Sin transferencias registradas en este período.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-550 font-bold uppercase">
                              <tr>
                                <th className="px-4 py-3 rounded-l-xl">Fecha</th>
                                <th className="px-4 py-3">Movimiento</th>
                                <th className="px-4 py-3">Detalle</th>
                                <th className="px-4 py-3 text-right rounded-r-xl">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {transferenciasFiltradas.map((t) => {
                                const isIncome = t.referencia.includes("Recibida");
                                return (
                                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                                      {new Date(t.fecha).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                        isIncome ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-[var(--utn-red)]"
                                      }`}>
                                        {isIncome ? "Recibido" : "Enviado"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <div className="font-bold text-slate-800">{t.referencia}</div>
                                      <div className="text-[10px] text-slate-400 max-w-xs truncate">{t.descripcion}</div>
                                    </td>
                                    <td className={`px-4 py-3.5 text-right font-black text-sm ${
                                      isIncome ? "text-emerald-655" : "text-slate-855"
                                    }`}>
                                      {formatCurrency(t.monto)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Pagos Externos */}
                  {activeTab === "expenses" && (
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Egresos / Pagos Externos</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {pagosExternosFiltrados.length} registros
                        </span>
                      </div>

                      {pagosExternosFiltrados.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">Sin pagos registrados en este período.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-550 font-bold uppercase">
                              <tr>
                                <th className="px-4 py-3 rounded-l-xl">Fecha</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3 text-right rounded-r-xl">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {pagosExternosFiltrados.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                                    {new Date(t.fecha).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3.5 font-bold text-slate-855">
                                    {t.descripcion}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-black text-sm text-slate-855">
                                    {formatCurrency(t.monto)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Pagos Compras */}
                  {activeTab === "purchases" && (
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Egresos por Compras (Proveedores)</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {comprasFiltradas.length} egresos
                        </span>
                      </div>

                      {comprasFiltradas.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">Sin egresos por compras en este período.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-550 font-bold uppercase">
                              <tr>
                                <th className="px-4 py-3 rounded-l-xl">Fecha</th>
                                <th className="px-4 py-3">Referencia</th>
                                <th className="px-4 py-3">Detalle</th>
                                <th className="px-4 py-3 text-right rounded-r-xl">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {comprasFiltradas.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                                    {new Date(t.fecha).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3.5 font-bold text-slate-855">
                                    {t.referencia}
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-400 truncate max-w-xs">
                                    {t.descripcion}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-black text-sm text-slate-855">
                                    {formatCurrency(t.monto)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Cobros CXC */}
                  {activeTab === "cxc" && (
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Recaudación de Cuentas por Cobrar</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {pagosRecaudadosCxcFiltradas.length} abonos
                        </span>
                      </div>

                      {pagosRecaudadosCxcFiltradas.length === 0 ? (
                        <div className="text-center py-16 text-slate-555">Sin cobros de CXC en este período.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-550 font-bold uppercase">
                              <tr>
                                <th className="px-4 py-3 rounded-l-xl">Fecha</th>
                                <th className="px-4 py-3">Referencia</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3 text-right rounded-r-xl">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {pagosRecaudadosCxcFiltradas.map((t) => (
                                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                                      {new Date(t.fecha).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3.5 font-bold text-slate-855">
                                      {t.referencia}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-400 truncate max-w-xs">
                                      {t.descripcion}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-black text-sm text-emerald-600">
                                      {formatCurrency(t.monto)}
                                    </td>
                                  </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Cobros Facturación */}
                  {activeTab === "billing" && (
                    <div className="p-6 space-y-6">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Recaudación Facturación Externa</span>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-655 flex-shrink-0">
                            <Activity className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-855 text-sm">Integración Módulo Facturación (GraphQL)</h4>
                            <p className="text-xs text-slate-550 mt-1">
                              Los cobros procesados por facturación en línea están disponibles en tiempo real.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-emerald-100/50 pt-4">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Saldo Facturación:</span>
                          <span className="text-xl font-black text-emerald-700">{formatCurrency(selectedReport.saldo_facturacion)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-455 shadow-sm">
                Selecciona una cuenta del listado izquierdo para ver los detalles.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
