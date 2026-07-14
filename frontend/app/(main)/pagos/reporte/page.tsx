"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo } from "react";
import FormularioPago from "../components/FormularioPago";
import { API_URL } from "@/app/config";
import DataTable, { ColumnDef } from "@/app/components/DataTable";
import DatePicker from "@/app/components/DatePicker";
import { useToast } from "@/app/components/toast";

export default function ReportePagosPage() {
  const { showToast } = useToast();
  interface CuentaBancaria {
    id: string;
    codigo: string;
    nombreCuenta: string;
    entidadBancaria: string;
    descripcion?: string;
    estado: string;
    clienteId?: string;
  }

  const [pagos, setPagos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pagoEditar, setPagoEditar] = useState<any>(null);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>(
    [],
  );
  const [clientes, setClientes] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);

  // ── Filtro de fechas ─────────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const anularPago = async (id: string) => {
    if (!confirm("¿Está seguro de que desea anular este pago?")) return;
    try {
      const response = await fetch(`${API_URL}/pagos/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showToast("Pago anulado correctamente.", "success");
        cargarPagos();
      } else {
        const err = await response.json();
        showToast("No fue posible anular el pago.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("No fue posible anular el pago.", "error");
    }
  };

  const cargarPagos = async () => {
    try {
      const response = await fetch(`${API_URL}/pagos/reporte`);

      const data = await response.json();

      setPagos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setPagos([]);
    }
  };

  const descargarPDFPago = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/pagos/${id}/pdf`);
      if (!response.ok) {
        showToast("No fue posible descargar el comprobante del pago.", "error");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Comprobante-Pago-${id}.pdf`;
      document.body.appendChild(a);
      

      setTimeout(() => {
        a.click();

        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
      }, 500);
      showToast("Comprobante PDF generado correctamente.", "success");
    } catch (error) {
      console.error(error);
      showToast(
        "No fue posible conectar con el servidor para descargar el PD.",
        "error",
      );
    }
  };

  const pagosFiltrados = pagos.filter((pago) => {
    if (filtroCliente && pago.clienteId !== filtroCliente) return false;

    // Filtro por rango de fechas usando hora LOCAL (no UTC) para evitar
    // el desfase de -5h que desplaza la fecha al día anterior en Ecuador
    if ((fechaInicio || fechaFin) && pago.fecha) {
      const d = new Date(pago.fecha);
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (fechaInicio && local < fechaInicio) return false;
      if (fechaFin && local > fechaFin) return false;
    }

    return true;
  });

  // Enriquecer pagos con campos de texto resueltos para que el DataTable
  // pueda buscar por nombre de cliente, código de cuenta, monto y fecha
  const pagosEnriquecidos = pagosFiltrados.map((pago) => {
    const cb = cuentasBancarias.find(
      (c: any) => c.id?.toString() === pago.cuentaBancariaId?.toString(),
    );
    return {
      ...pago,
      clienteNombre:
        clientes.find((c) => c.id === pago.clienteId)?.nombre || pago.clienteId,
      cuentaCodigo: cb?.codigo || pago.cuentaBancariaId || "—",
      cuentaNombre: cb ? `${cb.entidadBancaria} - ${cb.nombreCuenta}` : "—",
      montoTexto: `$${Number(pago.montoTotal).toLocaleString()}`,
      fechaTexto: pago.fecha ? new Date(pago.fecha).toLocaleDateString() : "—",
    };
  });

  const pagosActivos = pagosFiltrados.filter(
    (p) => p.estado?.toLowerCase() === "activo"
  );

  const totalPagos = pagosActivos.length;

  const montoTotal = pagosActivos.reduce((total, pago) => {
    return total + Number(pago.montoTotal || 0);
  }, 0);

  const cargarCuentasBancarias = async () => {
    try {
      const response = await fetch(`${API_URL}/cuentas-bancarias`);
      if (response.ok) {
        const data = await response.json();
        setCuentasBancarias(data);
      }
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await fetch(`${API_URL}/facturas/clientes`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        const listClients = Array.isArray(data) ? data : [];
        // Filtrar basura, deduplicar por cédula/RUC y ordenar alfabéticamente de la A a la Z
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
      setClientes([]);
    }
  };

  const cargarFacturas = async () => {
    try {
      const response = await fetch(`${API_URL}/facturas`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setFacturas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar facturas:", error);
    }
  };

  useEffect(() => {
    cargarPagos();
    cargarClientes();
    cargarCuentasBancarias();
    cargarFacturas();
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      key: "acciones",
      label: "Acciones",
      sortable: false,
      render: (pago) => {
        const isActivo =
          pago.estado?.toLowerCase() === "activo" ||
          pago.estado?.toLowerCase() === "impreso";
        return (
          <div className="flex gap-2">
            <button
              onClick={() => setPagoEditar(pago)}
              disabled={isActivo}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isActivo
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              Editar
            </button>
            <button
              onClick={() => {
                descargarPDFPago(pago.id);
                setPagos((prev: any[]) =>
                  prev.map((p) =>
                    p.id === pago.id ? { ...p, estado: "activo" } : p,
                  ),
                );
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-all"
            >
              PDF
            </button>
          </div>
        );
      },
    },
    {
      key: "numeroPago",
      label: "N° Pago",
      sortable: true,
    },
    {
      key: "clienteId",
      label: "Cliente",
      sortable: true,
      render: (pago) => (
        <span className="font-medium text-gray-900">{pago.clienteNombre}</span>
      ),
    },
    {
      key: "cuentaBancariaId",
      label: "Código Cuenta",
      sortable: false,
      render: (pago) => (
        <span className="text-gray-700">{pago.cuentaCodigo}</span>
      ),
    },
    {
      key: "cuentaNombre",
      label: "Cuenta Bancaria",
      sortable: true,
      render: (pago) => (
        <span className="text-gray-700 font-medium">{pago.cuentaNombre}</span>
      ),
    },
    {
      key: "montoTotal",
      label: "Monto Total",
      sortable: true,
      render: (pago) => (
        <span className="font-semibold text-gray-900">
          ${Number(pago.montoTotal).toLocaleString()}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      sortable: true,
      render: (pago) => (
        <span className="text-xs text-gray-600">
          {pago.fecha ? new Date(pago.fecha).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="metric-label">
            <span>Inicio</span>
            <span className="mx-1">/</span>
            <span className="text-gray-700 font-medium">Pagos</span>
          </nav>
          <h1 className="page-title">Pagos</h1>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="inline-flex items-center gap-2 bg-[var(--utn-red)] hover:bg-[var(--utn-red-dark)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nuevo Pago
        </button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total pagos", value: totalPagos, color: "text-gray-900" },
          {
            label: "Monto recaudado",
            value: `$${montoTotal.toLocaleString()}`,
            color: "text-emerald-600",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="metric-label mb-2">{label}</p>
            <p className={`metric-value ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtro de fechas ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <h2 className="section-title mb-4">Rango de fechas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <DatePicker
            label="Fecha de Inicio"
            value={fechaInicio}
            onChange={(v) => setFechaInicio(v)}
          />
          <DatePicker
            label="Fecha de Fin"
            value={fechaFin}
            onChange={(v) => setFechaFin(v)}
          />
          <button
            type="button"
            onClick={() => { setFechaInicio(""); setFechaFin(""); }}
            disabled={!fechaInicio && !fechaFin}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar fechas
          </button>
        </div>
        {(fechaInicio || fechaFin) && (
          <p className="mt-3 text-xs text-gray-500">
            Mostrando <strong className="text-gray-700">{pagosFiltrados.length}</strong> de {pagos.length} pagos
            {fechaInicio && <> desde <strong className="text-gray-700">{fechaInicio}</strong></>}
            {fechaFin && <> hasta <strong className="text-gray-700">{fechaFin}</strong></>}
          </p>
        )}
      </div>

      {/* ── DataTable ── */}
      <DataTable
        columns={columns}
        data={pagosEnriquecidos}
        rowKey={(row) => row.id}
        searchKeys={["numeroPago", "clienteNombre", "cuentaCodigo", "cuentaNombre"]}
        pageOptions={[5, 10, 25, 50]}
        emptyMessage="No existen pagos registrados."
      />

      {/* ── Modal Nuevo Pago ── */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden">
            <div className="bg-[var(--utn-red)] px-6 py-5 flex items-center justify-between text-white">
              <h2 className="text-lg font-bold">Registro de Pagos</h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <FormularioPago
                onGuardado={() => {
                  setMostrarModal(false);
                  cargarPagos();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Pago ── */}
      {pagoEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden">
            <div className="bg-[var(--utn-red)] px-6 py-5 flex items-center justify-between text-white">
              <h2 className="text-lg font-bold">Editar Pago</h2>
              <button
                onClick={() => setPagoEditar(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <FormularioPago
                pagoAEditar={pagoEditar}
                onGuardado={() => {
                  setPagoEditar(null);
                  cargarPagos();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
