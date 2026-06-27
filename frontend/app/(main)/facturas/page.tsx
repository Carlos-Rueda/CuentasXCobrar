"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from "react";
import { API_URL } from "@/app/config";
import DataTable, { ColumnDef } from "@/app/components/DataTable";

type Factura = {
  id: string;
  cliente: string;
  cedula: string;
  factura: string;
  fecha: string;
  estado: "Pagado" | "Por Pagar";
  monto: number;
  pagado: number;
  pendiente: number;
  pagosAsociados?: { id: string; montoAbonado: number; fecha: string }[];
  descripcion: string;
};

type SortKey = "cliente" | "factura" | "fecha" | "estado" | "monto";
type SortDir = "asc" | "desc";



function fmtFecha(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <span className="ml-1 text-slate-300">↕</span>;
  return <span className="ml-1 text-blue-500">{sortDir === "asc" ? "↑" : "↓"}</span>;
}
export default function FacturasPage() {
  const [facturas,   setFacturas]   = useState<Factura[]>([]);

  const cargarDatos = async () => {
    const fetchSafe = async (url: string): Promise<any[]> => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    try {
      const [listClients, listFacturas, listPagos] = await Promise.all([
        fetchSafe(`${API_URL}/facturas/clientes`),
        fetchSafe(`${API_URL}/facturas`),
        fetchSafe(`${API_URL}/pagos/reporte`),
      ]);

      const mappedFacturas: Factura[] = listFacturas.map((f: any) => {
        const client = listClients.find((c: any) => c.id === f.clienteId);
        
        let pagado = 0;
        const pagosAsociados: { id: string; montoAbonado: number; fecha: string }[] = [];
        listPagos.forEach((pago: any) => {
          const detail = pago.detalles?.find((d: any) => d.facturaId === f.id);
          if (detail) {
            pagado += detail.montoAbonado;
            pagosAsociados.push({
              id: pago.id,
              montoAbonado: detail.montoAbonado,
              fecha: pago.fecha,
            });
          }
        });

        if (f.estado === "PAGADA" && pagado === 0) {
          pagado = f.total;
        }

        let estado: "Pagado" | "Por Pagar" = "Por Pagar";
        if (pagado >= f.total) {
          estado = "Pagado";
        }

        return {
          id: f.id,
          cliente: client ? client.nombre : f.clienteId,
          cedula: client ? client.ruc : "—",
          factura: f.numero,
          fecha: f.fechaEmision,
          estado,
          monto: f.total,
          pagado,
          pendiente: Math.max(0, f.total - pagado),
          pagosAsociados,
          descripcion: f.detalles?.[0]?.producto || "",
        };
      });

      setFacturas(mappedFacturas);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [fCliente, setFCliente] = useState("");
  const [fFactura, setFFactura] = useState("");
  const [fEstado,  setFEstado]  = useState("");
  const [filtros,  setFiltros]  = useState({ cliente: "", factura: "", estado: "" });

  // ── Orden ──────────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const aplicarFiltros = () => {
    setFiltros({ cliente: fCliente, factura: fFactura, estado: fEstado });
  };

  const limpiarFiltros = () => {
    setFCliente(""); setFFactura(""); setFEstado("");
    setFiltros({ cliente: "", factura: "", estado: "" });
    setSortKey(null); setSortDir("asc");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") aplicarFiltros(); };

  const toggleSort = (col: SortKey) => {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("asc"); }
  };

  // ── Datos filtrados y ordenados ────────────────────────────────────────────
  const filtradas = useMemo(() => {
    let data = facturas.filter(f =>
      f.cliente.toLowerCase().includes(filtros.cliente.toLowerCase()) &&
      f.factura.toLowerCase().includes(filtros.factura.toLowerCase()) &&
      (filtros.estado === "" || f.estado === filtros.estado)
    );
    if (sortKey) {
      data = [...data].sort((a, b) => {
        let va: string | number = a[sortKey];
        let vb: string | number = b[sortKey];
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [facturas, filtros, sortKey, sortDir]);

  // ── Métricas ───────────────────────────────────────────────────────────────
  const { total, cobrado, porCobrar } = useMemo(() => {
    const total   = filtradas.reduce((s, f) => s + f.monto, 0);
    const cobrado = filtradas.filter(f => f.estado === "Pagado").reduce((s, f) => s + f.monto, 0);
    return { total, cobrado, porCobrar: total - cobrado };
  }, [filtradas]);

  const eliminar = (id: string) => setFacturas(prev => prev.filter(f => f.id !== id));

  const thSort = (col: SortKey, label: string) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors"
    >
      {label}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const columns: ColumnDef<Factura>[] = [
    {
      key: "acciones",
      label: "Acciones",
      sortable: false,
      render: (row) => (
        <button
          type="button"
          onClick={() => eliminar(row.id)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 active:scale-[0.98] transition-all"
        >
          Eliminar
        </button>
      ),
    },
    {
      key: "cliente",
      label: "Cliente",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.cliente}</p>
          <p className="font-mono text-xs text-gray-500 mt-0.5">{row.cedula}</p>
        </div>
      ),
    },
    { key: "factura", label: "N° Factura", sortable: true },
    {
      key: "fecha",
      label: "Fecha",
      sortable: true,
      render: (row) => <span className="text-xs text-gray-600">{fmtFecha(row.fecha)}</span>,
    },
    {
      key: "monto",
      label: "Total",
      sortable: true,
      render: (row) => <span className="font-semibold text-gray-900">${row.monto.toLocaleString()}</span>,
    },
    {
      key: "pagado",
      label: "Pagado",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-emerald-600 font-medium">${row.pagado.toLocaleString()}</p>
          {row.pagosAsociados && row.pagosAsociados.length > 0 && (
            <div className="text-[10px] text-gray-400 mt-0.5">
              {row.pagosAsociados.map((p) => (
                <div key={p.id}>Ref: {p.id} (${p.montoAbonado})</div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "pendiente",
      label: "Pendiente",
      sortable: true,
      render: (row) => <span className="text-red-600 font-medium">${row.pendiente.toLocaleString()}</span>,
    },
    {
      key: "descripcion",
      label: "Descripción",
      sortable: false,
      render: (row) => (
        <span className="text-xs text-gray-500 max-w-[160px] truncate block" title={row.descripcion}>
          {row.descripcion || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="text-xs text-gray-500 mb-1">
          <span>Inicio</span>
          <span className="mx-1">/</span>
          <span className="text-gray-700 font-medium">Facturas</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total facturas", value: facturas.length,                 color: "text-gray-900"    },
          { label: "Monto total",    value: `$${total.toLocaleString()}`,    color: "text-gray-900"    },
          { label: "Cobrado",        value: `$${cobrado.toLocaleString()}`,  color: "text-emerald-600" },
          { label: "Por cobrar",     value: `$${porCobrar.toLocaleString()}`, color: "text-red-600"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={facturas}
        rowKey={(row) => row.id}
        searchKeys={["cliente", "cedula", "factura", "descripcion"]}
        pageOptions={[5, 10, 25, 50]}
        emptyMessage="No hay facturas registradas."
      />
    </div>
  );
}