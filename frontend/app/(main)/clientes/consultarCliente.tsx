"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { API_URL } from "@/app/config";

export default function ConsultarCliente() {
  const [clienteId, setClienteId] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [dateError, setDateError] = useState("");
  
  const [clientes, setClientes] = useState<any[]>([]);
  const [statementData, setStatementData] = useState<any>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Filtros interactivos internos (profesionales)
  const [filtroEstadoFactura, setFiltroEstadoFactura] = useState("TODOS");
  const [busquedaFactura, setBusquedaFactura] = useState("");
  const [busquedaPago, setBusquedaPago] = useState("");

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const response = await fetch(`${API_URL}/facturas/clientes`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const listClients = Array.isArray(data) ? data : [];
          // Filtrar basura, deduplicar por cédula/RUC y ordenar alfabéticamente
          const uniqueMap = new Map(listClients.map((c: any) => [c.cedula || c.ruc || c.nombre, c]));
          const sortedUniqueCleanClients = Array.from(uniqueMap.values())
            .filter((c: any) => c.nombre && c.nombre.trim() !== "" && c.nombre.trim() !== "undefined")
            .sort((a: any, b: any) => (a.nombre || "").localeCompare(b.nombre || ""));
          setClientes(sortedUniqueCleanClients);
        }
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      }
    };
    cargarClientes();
  }, []);

  const filteredClientes = clientes.filter((c) => {
    const term = clientSearchTerm.toLowerCase();
    return (
      (c.nombre || "").toLowerCase().includes(term) ||
      (c.cedula || c.ruc || "").toLowerCase().includes(term)
    );
  });

  const consultarEstadoCuenta = async () => {
    if (!clienteId) {
      alert("Por favor, seleccione un cliente.");
      return;
    }
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      setDateError("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }
    setDateError("");
    setLoadingStatement(true);
    try {
      const queryParams = new URLSearchParams({
        clienteId,
        ...(fechaInicio && { fechaInicio }),
        ...(fechaFin && { fechaFin }),
      });
      const res = await fetch(`${API_URL}/reportes/estado-cuenta?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setStatementData(data);
        // Resetear filtros locales al consultar un nuevo estado de cuenta
        setFiltroEstadoFactura("TODOS");
        setBusquedaFactura("");
        setBusquedaPago("");
      } else {
        alert("No se encontró el estado de cuenta.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    } finally {
      setLoadingStatement(false);
    }
  };

  const descargarEstadoCuentaPdf = async () => {
    if (!clienteId) return;
    setIsDownloadingPdf(true);
    try {
      const queryParams = new URLSearchParams({
        clienteId,
        ...(fechaInicio && { fechaInicio }),
        ...(fechaFin && { fechaFin }),
      });
      const res = await fetch(`${API_URL}/reportes/estado-cuenta/pdf?${queryParams}`);
      if (!res.ok) {
        alert("No se pudo descargar el PDF de este estado de cuenta.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Estado-Cuenta-${clienteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert("¡El reporte PDF del estado de cuenta se generó y descargó con éxito!");
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor para descargar el PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Listados filtrados reactivos en tiempo real
  const facturasFiltradas = statementData
    ? statementData.facturas.filter((f: any) => {
        const matchesEstado = filtroEstadoFactura === "TODOS" || f.estado?.toUpperCase() === filtroEstadoFactura;
        const matchesBusqueda = !busquedaFactura || (f.numero || f.id || "").toLowerCase().includes(busquedaFactura.toLowerCase());
        return matchesEstado && matchesBusqueda;
      })
    : [];

  const pagosFiltrados = statementData
    ? statementData.pagos.filter((p: any) => {
        return !busquedaPago || (p.numeroPago || "").toLowerCase().includes(busquedaPago.toLowerCase());
      })
    : [];

  // Cálculos dinámicos basados en la selección de filtros del usuario
  const totalFacturadoCalculado = facturasFiltradas.reduce((sum: number, f: any) => sum + f.total, 0);
  const totalPagadoCalculado = pagosFiltrados.reduce((sum: number, p: any) => sum + p.montoTotal, 0);
  const saldoTotalCalculado = totalFacturadoCalculado - totalPagadoCalculado;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 md:p-6 bg-slate-50/50 rounded-2xl border border-slate-200">
      {/* Cabecera */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Estado de Cuenta del Cliente</h1>
        <p className="text-slate-500 text-sm mt-1">Consulta de facturas pendientes, abonos y reporte histórico consolidado.</p>
      </div>

      {/* Selector y Filtros de rango */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador inteligente cliente */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-semibold text-slate-500 mb-1">Buscar Cliente</label>
            <input
              type="text"
              placeholder="Escriba nombre o identificación..."
              value={clientSearchTerm}
              onChange={(e) => {
                setClientSearchTerm(e.target.value);
                setClientDropdownOpen(true);
                if (clienteId) {
                  setClienteId("");
                  setStatementData(null);
                }
              }}
              onFocus={() => setClientDropdownOpen(true)}
              onBlur={() => setTimeout(() => setClientDropdownOpen(false), 200)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            {clientDropdownOpen && filteredClientes.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 top-full left-0">
                {filteredClientes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClienteId(c.id);
                      setClientSearchTerm(`${c.nombre} - ${c.cedula || c.ruc || ""}`);
                      setClientDropdownOpen(false);
                    }}
                    className="p-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100 last:border-0"
                  >
                    {c.nombre} - {c.cedula || c.ruc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fecha de Inicio */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          {/* Fecha de Fin */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 mb-1">Fecha de Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </div>

        {dateError && (
          <p className="text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            ⚠️ {dateError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={consultarEstadoCuenta}
            disabled={!clienteId || loadingStatement}
            className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all ${
              !clienteId || loadingStatement
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            {loadingStatement ? "Consultando..." : "Consultar"}
          </button>

          {statementData && (
            <button
              type="button"
              onClick={descargarEstadoCuentaPdf}
              disabled={isDownloadingPdf}
              className={`px-5 py-2.5 border border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                isDownloadingPdf ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"
              }`}
            >
              {isDownloadingPdf ? "Generando PDF..." : "📥 Descargar Estado de Cuenta PDF"}
            </button>
          )}
        </div>
      </div>

      {/* Datos del Estado de Cuenta */}
      {statementData && (
        <div className="flex flex-col gap-6">
          {/* Métricas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Saldo Total */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-sm p-6 md:col-span-2 flex flex-col justify-between">
              <span className="text-sm font-medium opacity-85 uppercase tracking-wide">Saldo Total Pendiente</span>
              <div className="mt-4">
                <span className="text-4xl font-black">
                  ${saldoTotalCalculado.toFixed(2)}
                </span>
                <p className="text-xs opacity-75 mt-2">Diferencia neta entre facturas filtradas y abonos aplicados.</p>
              </div>
            </div>

            {/* Total Facturado */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Facturado</span>
              <div>
                <span className="text-2xl font-extrabold text-slate-800">
                  ${totalFacturadoCalculado.toFixed(2)}
                </span>
                <p className="text-xs text-slate-400 mt-1">Suma de facturas filtradas.</p>
              </div>
            </div>

            {/* Total Pagado */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Abonado</span>
              <div>
                <span className="text-2xl font-extrabold text-emerald-600">
                  ${totalPagadoCalculado.toFixed(2)}
                </span>
                <p className="text-xs text-slate-400 mt-1">Suma de abonos filtrados.</p>
              </div>
            </div>
          </div>

          {/* Tablas Detalle con filtros específicos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Facturas */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-between items-start sm:items-center pb-2 border-b">
                <h3 className="text-md font-bold text-slate-800">Facturas Emitidas</h3>
                <div className="flex gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Buscar Nº..."
                    value={busquedaFactura}
                    onChange={(e) => setBusquedaFactura(e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-28"
                  />
                  <select
                    value={filtroEstadoFactura}
                    onChange={(e) => setFiltroEstadoFactura(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="PAGADA">Pagadas</option>
                    <option value="EMITIDA">Emitidas</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b">
                      <th className="py-2.5 px-3">No. Factura</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Abonado</th>
                      <th className="py-2.5 px-3 text-right">Pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          Sin facturas registradas.
                        </td>
                      </tr>
                    ) : (
                      facturasFiltradas.map((f: any) => (
                        <tr key={f.id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{f.numero || f.id}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-xs">{f.fechaEmision || "—"}</td>
                          <td className="py-2.5 px-3 text-right font-mono">${f.total.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 font-mono">${f.pagado.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-red-600 font-mono font-semibold">${f.pendiente.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagos / Abonos */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-between items-start sm:items-center pb-2 border-b">
                <h3 className="text-md font-bold text-slate-800">Abonos Realizados</h3>
                <input
                  type="text"
                  placeholder="Buscar Nº transacción..."
                  value={busquedaPago}
                  onChange={(e) => setBusquedaPago(e.target.value)}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-44"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b">
                      <th className="py-2.5 px-3">No. Transacción</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Cuenta Destino</th>
                      <th className="py-2.5 px-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                          Sin abonos registrados.
                        </td>
                      </tr>
                    ) : (
                      pagosFiltrados.map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{p.numeroPago}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-xs">{p.fecha}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-xs">{p.cuentaBancaria}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 font-mono font-semibold">${p.montoTotal.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}