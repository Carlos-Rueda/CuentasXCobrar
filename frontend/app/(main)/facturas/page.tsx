"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from "react";
import { API_URL } from "@/app/config";

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
    try {
      const resClients = await fetch(`${API_URL}/facturas/clientes`, { cache: "no-store" });
      const rawClients = await resClients.json();
      const listClients = Array.isArray(rawClients) ? rawClients : [];

      const resFacturas = await fetch(`${API_URL}/facturas`, { cache: "no-store" });
      const rawFacturas = await resFacturas.json();
      const listFacturas = Array.isArray(rawFacturas) ? rawFacturas : [];

      const resPagos = await fetch(`${API_URL}/pagos/reporte`, { cache: "no-store" });
      const rawPagos = await resPagos.json();
      const listPagos = Array.isArray(rawPagos) ? rawPagos : [];

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

  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
    }`;

  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-800 mb-8">Facturas</h1>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total facturas", value: filtradas.length,                  color: "text-slate-800"   },
          { label: "Monto total",    value: `$${total.toLocaleString()}`,      color: "text-slate-800"   },
          { label: "Cobrado",        value: `$${cobrado.toLocaleString()}`,    color: "text-emerald-600" },
          { label: "Por cobrar",     value: `$${porCobrar.toLocaleString()}`,  color: "text-red-600"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xs font-semibold text-slate-400 tracking-widest mb-4 uppercase">Filtros de búsqueda</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <input type="text" placeholder="Cliente" value={fCliente}
            onChange={e => setFCliente(e.target.value)} onKeyDown={handleKeyDown}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" placeholder="N° factura" value={fFactura}
            onChange={e => setFFactura(e.target.value)} onKeyDown={handleKeyDown}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={fEstado} onChange={e => setFEstado(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Por Pagar">Por Pagar</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={aplicarFiltros}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            Buscar
          </button>
          <button type="button" onClick={limpiarFiltros}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Barra superior ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{filtradas.length} factura{filtradas.length !== 1 ? "s" : ""}</p>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {thSort("cliente", "Cliente")}
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Cédula</th>
              {thSort("factura", "N° factura")}
              {thSort("fecha",   "Fecha")}
              {thSort("estado",  "Estado")}
              {thSort("monto",   "Total")}
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Pagado</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Pendiente</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Descripción</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-slate-400 text-sm">
                  No hay facturas que coincidan con los filtros.
                </td>
              </tr>
            ) : filtradas.map(f => (
              <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{f.cliente}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{f.cedula}</td>
                <td className="px-5 py-3 text-slate-700">{f.factura}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtFecha(f.fecha)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    f.estado === "Pagado" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>{f.estado}</span>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-800">${f.monto.toLocaleString()}</td>
                <td className="px-5 py-3 text-emerald-600 font-medium">
                  <div>${f.pagado.toLocaleString()}</div>
                  {f.pagosAsociados && f.pagosAsociados.length > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1 font-sans font-normal leading-relaxed">
                      {f.pagosAsociados.map((p) => (
                        <div key={p.id}>
                          Ref: PAG-{p.id} (${p.montoAbonado})
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-red-600 font-medium">${f.pendiente.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 text-xs max-w-[180px] truncate">{f.descripcion || "—"}</td>
                <td className="px-5 py-3">
                  <button type="button" onClick={() => eliminar(f.id)} aria-label="Eliminar factura"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pie de tabla */}
        {filtradas.length > 0 && (
          <div className="flex justify-end gap-6 px-5 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">Total: <strong className="text-slate-800">{filtradas.length}</strong></span>
            <span className="text-slate-500">Monto total: <strong className="text-slate-800">${total.toLocaleString()}</strong></span>
            <span className="text-slate-500">Por cobrar: <strong className="text-red-600">${porCobrar.toLocaleString()}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}