"use client";

import { useState, useMemo } from "react";

type Registro = {
  cliente: string;
  cedula: string;
  factura: string;
  fecha: string;
  estado: "Pagado" | "Parcial" | "Por Pagar";
  monto: number;
  pagado: number;
  ultimoPago: string | null;
};

// ── Datos mock (reemplazar con fetch GET a la API cuando esté lista) ──────────
// TODO: const res = await fetch("http://localhost:3001/cobros");
const DATOS_MOCK: Registro[] = [
  { cliente: "Juan Pérez",  cedula: "0912345678", factura: "FAC-001", fecha: "14/06/2026", estado: "Pagado",    monto: 250, pagado: 250, ultimoPago: "14/06/2026" },
  { cliente: "María López", cedula: "0923456789", factura: "FAC-002", fecha: "12/06/2026", estado: "Por Pagar", monto: 480, pagado: 0,   ultimoPago: null },
  { cliente: "Carlos Vera", cedula: "0934567890", factura: "FAC-003", fecha: "10/06/2026", estado: "Pagado",    monto: 150, pagado: 150, ultimoPago: "10/06/2026" },
  { cliente: "Ana Gómez",   cedula: "0945678901", factura: "FAC-004", fecha: "08/06/2026", estado: "Por Pagar", monto: 900, pagado: 0,   ultimoPago: null },
  { cliente: "Luis Torres", cedula: "0956789012", factura: "FAC-005", fecha: "05/06/2026", estado: "Parcial",   monto: 600, pagado: 300, ultimoPago: "07/06/2026" },
  { cliente: "Rosa Méndez", cedula: "0967890123", factura: "FAC-006", fecha: "01/06/2026", estado: "Pagado",    monto: 320, pagado: 320, ultimoPago: "03/06/2026" },
];

const PER_PAGE = 5;

// ── Utilidades ─────────────────────────────────────────────────────────────────
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
  if (!w) { alert("El navegador bloqueó la ventana emergente. Permítala e intente de nuevo."); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 800);
}

async function descargarPDF(r: Registro) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Recibo de cobro", 20, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Sistema de Cuentas por Cobrar", 20, 30);

    doc.setDrawColor(220);
    doc.line(20, 35, 190, 35);

    const rows: [string, string][] = [
      ["Cliente",          r.cliente],
      ["Cédula",           r.cedula],
      ["Factura",          r.factura],
      ["Fecha",            r.fecha],
      ["Estado",           r.estado],
      ["Monto total",      `$${r.monto.toLocaleString()}`],
      ["Pagado",           `$${r.pagado.toLocaleString()}`],
      ["Saldo pendiente",  `$${(r.monto - r.pagado).toLocaleString()}`],
      ["Último pago",      r.ultimoPago ?? "Sin pagos"],
    ];

    let y = 46;
    doc.setTextColor(0);
    rows.forEach(([label, val]) => {
      doc.setFont("helvetica", "normal"); doc.setTextColor(120); doc.text(label, 20, y);
      doc.setFont("helvetica", "bold");  doc.setTextColor(30);  doc.text(val, 95, y);
      y += 10;
    });

    doc.setFontSize(9);
    doc.setTextColor(160);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${new Date().toLocaleDateString("es-EC")}`, 20, 285);

    doc.save(`Recibo-${r.factura}.pdf`);
  } catch (e) {
    console.error(e);
    alert("Error generando el PDF. Verifique que jspdf esté instalado: npm install jspdf");
  }
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const [fCliente,  setFCliente]  = useState("");
  const [fCedula,   setFCedula]   = useState("");
  const [fFactura,  setFFactura]  = useState("");
  const [fEstado,   setFEstado]   = useState("");
  const [fMontoMin, setFMontoMin] = useState("");
  const [fMontoMax, setFMontoMax] = useState("");
  const [page,      setPage]      = useState(1);

  const filtrados = useMemo(() => DATOS_MOCK.filter(r =>
    r.cliente.toLowerCase().includes(fCliente.toLowerCase()) &&
    r.cedula.includes(fCedula) &&
    r.factura.toLowerCase().includes(fFactura.toLowerCase()) &&
    (fEstado === "" || r.estado === fEstado) &&
    (fMontoMin === "" || r.monto >= Number(fMontoMin)) &&
    (fMontoMax === "" || r.monto <= Number(fMontoMax))
  ), [fCliente, fCedula, fFactura, fEstado, fMontoMin, fMontoMax]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const pagina = Math.min(page, totalPages);
  const slice = filtrados.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE);

  const totalMonto   = filtrados.reduce((s, r) => s + r.monto,  0);
  const totalCobrado = filtrados.reduce((s, r) => s + r.pagado, 0);
  const totalDeuda   = totalMonto - totalCobrado;

  const cambiarFiltro = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  // ── Badge de estado ────────────────────────────────────────────────────────
  const badgeClass: Record<string, string> = {
    "Pagado":    "bg-emerald-100 text-emerald-700",
    "Parcial":   "bg-amber-100 text-amber-700",
    "Por Pagar": "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-800 mb-8">Reportes</h1>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xs font-semibold text-slate-400 tracking-widest mb-4 uppercase">Filtros</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { placeholder: "Cliente",       value: fCliente,  setter: setFCliente  },
            { placeholder: "Cédula",        value: fCedula,   setter: setFCedula   },
            { placeholder: "N° factura",    value: fFactura,  setter: setFFactura  },
            { placeholder: "Monto mínimo",  value: fMontoMin, setter: setFMontoMin, type: "number" },
            { placeholder: "Monto máximo",  value: fMontoMax, setter: setFMontoMax, type: "number" },
          ].map(({ placeholder, value, setter, type }) => (
            <input
              key={placeholder}
              type={type ?? "text"}
              placeholder={placeholder}
              value={value}
              onChange={cambiarFiltro(setter)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
          <select
            value={fEstado}
            onChange={cambiarFiltro(setFEstado)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Parcial">Parcial</option>
            <option value="Por Pagar">Por Pagar</option>
          </select>
        </div>
      </div>

      {/* ── Métricas resumen ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Registros",   value: filtrados.length,              color: "text-slate-800" },
          { label: "Total",       value: `$${totalMonto.toLocaleString()}`,   color: "text-slate-800" },
          { label: "Cobrado",     value: `$${totalCobrado.toLocaleString()}`, color: "text-emerald-600" },
          { label: "Por cobrar",  value: `$${totalDeuda.toLocaleString()}`,   color: "text-red-600" },
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
              {["Cliente","Cédula","Factura","Fecha","Estado","Monto","Saldo / deuda","Último pago","Acciones"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{h}</th>
              ))}
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

                  {/* Columna Saldo / deuda */}
                  <td className="px-5 py-3">
                    <p className="text-xs text-slate-500">${r.pagado.toLocaleString()} de ${r.monto.toLocaleString()}</p>
                    {deuda > 0
                      ? <p className="text-xs font-medium text-red-600 mt-0.5">Debe ${deuda.toLocaleString()}</p>
                      : <p className="text-xs font-medium text-emerald-600 mt-0.5">Saldo saldado ✓</p>
                    }
                  </td>

                  {/* Columna Último pago */}
                  <td className="px-5 py-3">
                    {r.ultimoPago
                      ? <><p className="text-xs font-medium text-slate-700">{r.ultimoPago}</p><p className="text-xs text-slate-400">último pago</p></>
                      : <p className="text-xs text-slate-400">Sin pagos</p>
                    }
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => imprimirRecibo(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
                      >
                        🖨 Imprimir
                      </button>
                      <button
                        type="button"
                        onClick={() => descargarPDF(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-medium hover:bg-emerald-50 transition-colors"
                      >
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
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  p === pagina
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={pagina === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >›</button>
          </div>
        </div>
      </div>
    </div>
  );
}