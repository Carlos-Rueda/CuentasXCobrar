"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from "react";
import { API_URL } from "@/app/config";

type Registro = {
  id: string;
  cliente: string;
  cedula: string;
  factura: string;
  fecha: string;
  estado: "Pagado" | "Parcial" | "Por Pagar";
  monto: number;
  pagado: number;
  ultimoPago: string | null;
};

type SortKey = "cliente" | "factura" | "fecha" | "estado" | "monto";
type SortDir = "asc" | "desc";


const PER_PAGE = 5;

function imprimirRecibo(r: Registro) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${r.factura}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:48px;max-width:520px;margin:auto}
    h1{font-size:20px;font-weight:600;margin-bottom:8px}
    .sub{color:#666;font-size:13px;margin-bottom:32px}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 0;font-size:14px;border-bottom:1px solid #eee}
    td:first-child{color:#666;width:40%}
    td:last-child{font-weight:500}
    .footer{margin-top:40px;font-size:12px;color:#999;text-align:center}
  </style></head><body>
  <h1>Recibo de cobro</h1>
  <div class="sub">Sistema de Cuentas por Cobrar</div>
  <table>
    <tr><td>Cliente</td><td>${r.cliente}</td></tr>
    <tr><td>Cédula</td><td>${r.cedula}</td></tr>
    <tr><td>Factura</td><td>${r.factura}</td></tr>
    <tr><td>Fecha</td><td>${r.fecha}</td></tr>
    <tr><td>Estado</td><td>${r.estado}</td></tr>
    <tr><td>Monto total</td><td>$${r.monto.toLocaleString()}</td></tr>
    <tr><td>Pagado</td><td style="color:#16a34a">$${r.pagado.toLocaleString()}</td></tr>
    <tr><td>Saldo pendiente</td><td style="color:${r.monto - r.pagado > 0 ? "#dc2626" : "#16a34a"}">$${(r.monto - r.pagado).toLocaleString()}</td></tr>
    <tr><td>Último pago</td><td>${r.ultimoPago ?? "Sin pagos"}</td></tr>
  </table>
  <div class="footer">Generado el ${new Date().toLocaleDateString("es-EC")}</div>
  </body></html>`;
  const w = window.open("", "_blank", "width=600,height=700");
  if (!w) { alert("El navegador bloqueó la ventana emergente."); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 800);
}

async function descargarPDF(r: Registro) {
  try {
    const res = await fetch(`${API_URL}/mock-facturacion/facturas/${r.id}/pdf`);
    if (!res.ok) {
      alert(`No se encontró el comprobante para la factura "${r.factura}" en el servidor.`);
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Factura-${r.factura}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Error al conectar con el servidor para descargar el PDF.");
  }
}

// ── Icono de orden ─────────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <span className="ml-1 text-slate-300">↕</span>;
  return <span className="ml-1 text-blue-500">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function ReportesPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [fCliente, setFCliente] = useState("");
  const [fCedula,  setFCedula]  = useState("");
  const [fFactura, setFFactura] = useState("");
  const [fEstado,  setFEstado]  = useState("");
  const [filtros,  setFiltros]  = useState({ cliente: "", cedula: "", factura: "", estado: "" });
  const [page,     setPage]     = useState(1);
  const [sortKey,  setSortKey]  = useState<SortKey | null>(null);
  const [sortDir,  setSortDir]  = useState<SortDir>("asc");

  const cargarDatos = async () => {
    try {
      const resClients = await fetch(`${API_URL}/mock-facturacion/clientes`, { cache: 'no-store' });
      const listClients = await resClients.json();

      const resFacturas = await fetch(`${API_URL}/mock-facturacion/facturas`, { cache: 'no-store' });
      const listFacturas = await resFacturas.json();

      const resPagos = await fetch(`${API_URL}/pagos/reporte`, { cache: 'no-store' });
      const listPagos = await resPagos.json();

      const mappedRegistros: Registro[] = listFacturas.map((f: any) => {
        const client = listClients.find((c: any) => c.id === f.clienteId);
        
        let pagado = 0;
        let ultimoPago: string | null = null;
        
        listPagos.forEach((pago: any) => {
          const detail = pago.detalles?.find((d: any) => d.facturaId === f.id);
          if (detail) {
            pagado += detail.montoAbonado;
            ultimoPago = pago.fecha;
          }
        });

        if (f.estado === "PAGADA" && pagado === 0) {
          pagado = f.total;
        }

        let estado: "Pagado" | "Parcial" | "Por Pagar" = "Por Pagar";
        if (pagado >= f.total) {
          estado = "Pagado";
        } else if (pagado > 0) {
          estado = "Parcial";
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
          ultimoPago: ultimoPago ? new Date(ultimoPago).toLocaleDateString("es-EC") : null
        };
      });

      setRegistros(mappedRegistros);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const aplicarFiltros = () => {
    setFiltros({ cliente: fCliente, cedula: fCedula, factura: fFactura, estado: fEstado });
    setPage(1);
  };

  const limpiarFiltros = () => {
    setFCliente(""); setFCedula(""); setFFactura(""); setFEstado("");
    setFiltros({ cliente: "", cedula: "", factura: "", estado: "" });
    setSortKey(null); setSortDir("asc"); setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") aplicarFiltros(); };

  const toggleSort = (col: SortKey) => {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("asc"); }
    setPage(1);
  };

  const filtrados = useMemo(() => {
    let data = registros.filter(r =>
      r.cliente.toLowerCase().includes(filtros.cliente.toLowerCase()) &&
      r.cedula.includes(filtros.cedula) &&
      r.factura.toLowerCase().includes(filtros.factura.toLowerCase()) &&
      (filtros.estado === "" || r.estado === filtros.estado)
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
  }, [filtros, sortKey, sortDir]);

  const totalPages   = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const pagina       = Math.min(page, totalPages);
  const slice        = filtrados.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE);
  const totalMonto   = filtrados.reduce((s, r) => s + r.monto,  0);
  const totalCobrado = filtrados.reduce((s, r) => s + r.pagado, 0);
  const totalDeuda   = totalMonto - totalCobrado;

  const badgeClass: Record<string, string> = {
    "Pagado":    "bg-emerald-100 text-emerald-700",
    "Parcial":   "bg-amber-100 text-amber-700",
    "Por Pagar": "bg-red-100 text-red-700",
  };

  const thClass = (col: SortKey) =>
    `px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors`;

  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-800 mb-8">Reportes</h1>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xs font-semibold text-slate-400 tracking-widest mb-4 uppercase">Filtros de búsqueda</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <input type="text" placeholder="Cliente"    value={fCliente} onChange={e => setFCliente(e.target.value)} onKeyDown={handleKeyDown}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" placeholder="Cédula"     value={fCedula}  onChange={e => setFCedula(e.target.value)}  onKeyDown={handleKeyDown}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" placeholder="N° factura" value={fFactura} onChange={e => setFFactura(e.target.value)} onKeyDown={handleKeyDown}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={fEstado} onChange={e => setFEstado(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Parcial">Parcial</option>
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

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Registros",  value: filtrados.length,                    color: "text-slate-800"   },
          { label: "Total",      value: `$${totalMonto.toLocaleString()}`,   color: "text-slate-800"   },
          { label: "Cobrado",    value: `$${totalCobrado.toLocaleString()}`, color: "text-emerald-600" },
          { label: "Por cobrar", value: `$${totalDeuda.toLocaleString()}`,   color: "text-red-600"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className={thClass("cliente")} onClick={() => toggleSort("cliente")}>
                Cliente <SortIcon col="cliente" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Cédula</th>
              <th className={thClass("factura")} onClick={() => toggleSort("factura")}>
                Factura <SortIcon col="factura" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={thClass("fecha")} onClick={() => toggleSort("fecha")}>
                Fecha <SortIcon col="fecha" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={thClass("estado")} onClick={() => toggleSort("estado")}>
                Estado <SortIcon col="estado" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={thClass("monto")} onClick={() => toggleSort("monto")}>
                Monto <SortIcon col="monto" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Saldo / deuda</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Último pago</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-sm">Sin resultados con los filtros actuales</td></tr>
            ) : slice.map(r => {
              const deuda = r.monto - r.pagado;
              return (
                <tr key={r.factura} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{r.cliente}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.cedula}</td>
                  <td className="px-5 py-3 text-slate-700">{r.factura}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{r.fecha}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass[r.estado]}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-800">${r.monto.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <p className="text-xs text-slate-500">${r.pagado.toLocaleString()} de ${r.monto.toLocaleString()}</p>
                    {deuda > 0
                      ? <p className="text-xs font-medium text-red-600 mt-0.5">Debe ${deuda.toLocaleString()}</p>
                      : <p className="text-xs font-medium text-emerald-600 mt-0.5">Saldo saldado ✓</p>}
                  </td>
                  <td className="px-5 py-3">
                    {r.ultimoPago
                      ? <><p className="text-xs font-medium text-slate-700">{r.ultimoPago}</p><p className="text-xs text-slate-400">último pago</p></>
                      : <p className="text-xs text-slate-400">Sin pagos</p>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => imprimirRecibo(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors">
                        🖨 Imprimir
                      </button>
                      <button type="button" onClick={() => descargarPDF(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-medium hover:bg-emerald-50 transition-colors">
                        ↓ PDF
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Paginación ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Mostrando {Math.min((pagina - 1) * PER_PAGE + 1, filtrados.length)}–{Math.min(pagina * PER_PAGE, filtrados.length)} de {filtrados.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  p === pagina ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pagina === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}