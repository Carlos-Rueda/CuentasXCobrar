"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/config";
import DatePicker from "@/app/components/DatePicker";
import { useToast } from "@/app/components/toast";
import DataTable, { ColumnDef } from "@/app/components/DataTable";

export default function ConsultarCliente() {
  const { showToast } = useToast();
  const [clienteId, setClienteId] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [dateError, setDateError] = useState("");

  const [clientes, setClientes] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);



  const columnsFacturas: ColumnDef<any>[] = [
    {
      key: "numero",
      label: "No. Factura",
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.numero || row.id}</span>
    },
    {
      key: "fechaEmision",
      label: "Fecha",
      sortable: true,
      render: (row) => <span className="text-xs text-gray-500">{row.fechaEmision || "—"}</span>
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      className: "text-right",
      render: (row) => <span className="text-gray-900">${row.total.toFixed(2)}</span>
    },
    {
      key: "pagado",
      label: "Abonado",
      sortable: true,
      className: "text-right",
      render: (row) => <span className="text-emerald-600 font-medium">${row.pagado.toFixed(2)}</span>
    },
    {
      key: "pendiente",
      label: "Pendiente",
      sortable: true,
      className: "text-right",
      render: (row) => <span className="text-red-600 font-semibold">${row.pendiente.toFixed(2)}</span>
    }
  ];

  const columnsPagos: ColumnDef<any>[] = [
    {
      key: "numeroPago",
      label: "No. Transacción",
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.numeroPago}</span>
    },
    {
      key: "fecha",
      label: "Fecha",
      sortable: true,
      render: (row) => <span className="text-xs text-gray-500">{row.fecha}</span>
    },
    {
      key: "cuentaBancaria",
      label: "Cuenta Destino",
      sortable: true,
      render: (row) => <span className="text-xs text-gray-500">{row.cuentaBancaria}</span>
    },
    {
      key: "montoTotal",
      label: "Monto",
      sortable: true,
      className: "text-right",
      render: (row) => <span className="text-emerald-600 font-semibold">${row.montoTotal.toFixed(2)}</span>
    }
  ];

  useEffect(() => {
    const cargarClientes = async () => {
      setLoadingClientes(true);
      try {
        const response = await fetch(`${API_URL}/facturas/clientes`, {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          const listClients = Array.isArray(data) ? data : [];
          // Filtrar basura, deduplicar por cédula/RUC y ordenar alfabéticamente
          const uniqueMap = new Map(
            listClients.map((c: any) => [c.cedula || c.ruc || c.nombre, c]),
          );
          const sortedUniqueCleanClients = Array.from(uniqueMap.values())
            .filter(
              (c: any) =>
                c.nombre &&
                c.nombre.trim() !== "" &&
                c.nombre.trim() !== "undefined",
            )
            .sort((a: any, b: any) =>
              (a.nombre || "").localeCompare(b.nombre || ""),
            );
          setClientes(sortedUniqueCleanClients);
        }
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      } finally {
        setLoadingClientes(false);
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
      showToast("Seleccione un cliente para continuar.", "error");
      return;
    }
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      setDateError(
        "La fecha de inicio no puede ser posterior a la fecha de fin.",
      );
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
      const res = await fetch(
        `${API_URL}/reportes/estado-cuenta?${queryParams}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStatementData(data);
      } else {
        showToast(
          "No se encontró información para el cliente seleccionado.",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showToast("No fue posible conectar con el servidor.", "error");
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
      const res = await fetch(
        `${API_URL}/reportes/estado-cuenta/pdf?${queryParams}`,
      );
      if (!res.ok) {
        showToast("No fue posible generar el reporte PDF.", "error");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Estado-Cuenta-${clienteId}.pdf`;
      document.body.appendChild(a);
      setTimeout(() => {
        a.click();

        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
      }, 500);

      showToast("Reporte PDF generado y descargado correctamente.", "success");
    } catch (error) {
      console.error(error);
      showToast("No fue posible descargar el reporte PDF.", "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Listados filtrados reactivos en tiempo real
  const facturasFiltradas = statementData
    ? statementData.facturas
    : [];

  const cuentasDisponibles = statementData
    ? Array.from(new Set(statementData.pagos.map((p: any) => p.cuentaBancaria).filter(Boolean)))
    : [];

  const pagosFiltrados = statementData
    ? statementData.pagos
    : [];

  // Cálculos dinámicos basados en la selección de filtros del usuario
  const totalFacturadoCalculado = facturasFiltradas.reduce(
    (sum: number, f: any) => sum + f.total,
    0,
  );
  const totalPagadoCalculado = pagosFiltrados.reduce(
    (sum: number, p: any) => sum + p.montoTotal,
    0,
  );
  const saldoTotalCalculado = totalFacturadoCalculado - totalPagadoCalculado;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 md:p-6 bg-gray-50/50 rounded-2xl border border-gray-200">
      {/* Cabecera */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Estado de Cuenta del Cliente
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Consulta de facturas pendientes, abonos y reporte histórico consolidado.
        </p>
      </div>

      {/* Selector y Filtros de rango */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador inteligente cliente */}
          <div className="flex flex-col gap-1 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-500 mb-1">Buscar Cliente</label>
              {loadingClientes && (
                <span className="text-[10px] text-blue-500 font-medium animate-pulse flex items-center gap-0.5">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando...
                </span>
              )}
            </div>
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
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 w-full"
            />
            {clientDropdownOpen && filteredClientes.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 top-full left-0">
                {filteredClientes.map((c) => (
                  <div
                    key={c.id}
                    onMouseDown={() => {
                      setClienteId(c.id);
                      setClientSearchTerm(
                        `${c.nombre} - ${c.ruc || c.cedula || ""}`,
                      );
                      setClientDropdownOpen(false);
                    }}
                    className="p-2 hover:bg-red-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100 last:border-0"
                  >
                    {c.nombre} - {c.ruc || c.cedula || ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fecha de Inicio */}
          <DatePicker
            label="Fecha de Inicio"
            value={fechaInicio}
            onChange={setFechaInicio}
          />

          {/* Fecha de Fin */}
          <DatePicker
            label="Fecha de Fin"
            value={fechaFin}
            onChange={setFechaFin}
          />
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
                : "bg-[var(--utn-red)] hover:bg-[var(--utn-red-dark)] active:scale-[0.98]"
            }`}
          >
            {loadingStatement ? "Consultando..." : "Consultar"}
          </button>

          {statementData && (
            <button
              type="button"
              onClick={descargarEstadoCuentaPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isDownloadingPdf ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Descargar Estado de Cuenta PDF
                </>
              )}
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
            <div
              className="text-white rounded-2xl shadow-sm p-6 md:col-span-2 flex flex-col justify-between"
              style={{
                background: "linear-gradient(135deg, var(--utn-red), var(--utn-red-dark))",
              }}
            >
              <span className="text-sm font-medium opacity-85 uppercase tracking-wide">
                Saldo Total Pendiente
              </span>
              <div className="mt-4">
                <span className="metric-value">${saldoTotalCalculado.toFixed(2)}</span>
                <p className="text-xs opacity-75 mt-2">
                  Diferencia neta entre facturas filtradas y abonos aplicados.
                </p>
              </div>
            </div>

            {/* Total Facturado */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Facturado</span>
              <div>
                <span className="text-2xl font-bold text-gray-900">${totalFacturadoCalculado.toFixed(2)}</span>
                <p className="text-xs text-gray-400 mt-1">Suma de facturas filtradas.</p>
              </div>
            </div>

            {/* Total Pagado */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Abonado</span>
              <div>
                <span className="text-2xl font-bold text-emerald-600">${totalPagadoCalculado.toFixed(2)}</span>
                <p className="text-xs text-gray-400 mt-1">Suma de abonos filtrados.</p>
              </div>
            </div>
          </div>

          {/* Tablas Detalle con filtros específicos (Dos columnas compactas) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Facturas */}
            <div className="flex flex-col gap-3">
              <h3 className="text-md font-bold text-gray-900 px-1">Facturas Emitidas</h3>
              <DataTable
                columns={columnsFacturas}
                data={facturasFiltradas}
                rowKey={(row) => row.id}
                searchKeys={["numero", "id"]}
                pageOptions={[5, 10, 25]}
                emptyMessage="Sin facturas registradas."
                showSearch={false}
                showPageSize={false}
                compact={true}
              />
            </div>

            {/* Pagos / Abonos */}
            <div className="flex flex-col gap-3">
              <h3 className="text-md font-bold text-gray-900 px-1">Abonos Realizados</h3>
              <DataTable
                columns={columnsPagos}
                data={pagosFiltrados}
                rowKey={(row) => row.id}
                searchKeys={["numeroPago", "cuentaBancaria"]}
                pageOptions={[5, 10, 25]}
                emptyMessage="Sin abonos registrados."
                showSearch={false}
                showPageSize={false}
                compact={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
