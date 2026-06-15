"use client";

import { useState, useMemo } from "react";

// ── Tipo ───────────────────────────────────────────────────────────────────────
type Factura = {
  id: number;
  cliente: string;
  cedula: string;
  factura: string;
  fecha: string;
  estado: "Pagado" | "Por Pagar";
  monto: number;
  descripcion: string;
};

// ── Datos mock (reemplazar con GET a la API cuando esté lista) ─────────────────
// TODO: const res = await fetch("http://localhost:3001/facturas");
const MOCK: Factura[] = [
  { id: 1, cliente: "Juan Pérez",   cedula: "0912345678", factura: "FAC-001", fecha: "2026-06-14", estado: "Pagado",    monto: 250, descripcion: "Servicio de consultoría mensual" },
  { id: 2, cliente: "María López",  cedula: "0923456789", factura: "FAC-002", fecha: "2026-06-12", estado: "Por Pagar", monto: 480, descripcion: "Suministros de oficina" },
  { id: 3, cliente: "Carlos Vera",  cedula: "0934567890", factura: "FAC-003", fecha: "2026-06-10", estado: "Por Pagar", monto: 150, descripcion: "" },
];

// ── Formulario vacío ───────────────────────────────────────────────────────────
const EMPTY_FORM = {
  cliente:     "",
  cedula:      "",
  factura:     "",
  fecha:       "",
  estado:      "Por Pagar" as "Pagado" | "Por Pagar",
  monto:       "",
  descripcion: "",
};

type FormErrors = Partial<Record<keyof typeof EMPTY_FORM, string>>;

// ── Helper ─────────────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>(MOCK);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [nextId, setNextId]       = useState(MOCK.length + 1);

  // ── Métricas ───────────────────────────────────────────────────────────────
  const { total, cobrado, porCobrar } = useMemo(() => {
    const total     = facturas.reduce((s, f) => s + f.monto, 0);
    const cobrado   = facturas.filter(f => f.estado === "Pagado").reduce((s, f) => s + f.monto, 0);
    return { total, cobrado, porCobrar: total - cobrado };
  }, [facturas]);

  // ── Abrir / cerrar modal ───────────────────────────────────────────────────
  const abrirModal  = () => { setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const cerrarModal = () => setModalOpen(false);

  // ── Cambio de campo ────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // ── Validar ────────────────────────────────────────────────────────────────
  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.cliente.trim())             errs.cliente  = "Ingrese el nombre del cliente";
    if (!/^\d{10}$/.test(form.cedula))    errs.cedula   = "La cédula debe tener 10 dígitos";
    if (!form.factura.trim())             errs.factura  = "Ingrese el número de factura";
    if (!form.fecha)                      errs.fecha    = "Seleccione una fecha";
    if (!form.monto || Number(form.monto) <= 0) errs.monto = "El monto debe ser mayor a 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Guardar factura ────────────────────────────────────────────────────────
  const guardarFactura = () => {
    if (!validar()) return;

    const nueva: Factura = {
      id:          nextId,
      cliente:     form.cliente.trim(),
      cedula:      form.cedula.trim(),
      factura:     form.factura.trim(),
      fecha:       form.fecha,
      estado:      form.estado,
      monto:       Number(form.monto),
      descripcion: form.descripcion.trim(),
    };

    // TODO: cuando llegue la API, enviar con POST:
    // await fetch("http://localhost:3001/facturas", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(nueva),
    // });

    setFacturas(prev => [...prev, nueva]);
    setNextId(n => n + 1);
    cerrarModal();
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const eliminar = (id: number) => {
    // TODO: await fetch(`http://localhost:3001/facturas/${id}`, { method: "DELETE" });
    setFacturas(prev => prev.filter(f => f.id !== id));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-800 mb-8">Facturas</h1>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total facturas", value: facturas.length,                      color: "text-slate-800" },
          { label: "Monto total",    value: `$${total.toLocaleString()}`,         color: "text-slate-800" },
          { label: "Cobrado",        value: `$${cobrado.toLocaleString()}`,       color: "text-emerald-600" },
          { label: "Por cobrar",     value: `$${porCobrar.toLocaleString()}`,     color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Barra superior ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {facturas.length} factura{facturas.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={abrirModal}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Nueva factura
        </button>
      </div>

      {/* ── Modal nueva factura ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg mx-4 p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Nueva factura</h2>
              <button
                type="button"
                onClick={cerrarModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar"
              >✕</button>
            </div>

            {/* Campos */}
            <div className="grid grid-cols-2 gap-3">

              {/* Cliente */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Cliente *</label>
                <input
                  name="cliente"
                  type="text"
                  placeholder="Nombre completo"
                  value={form.cliente}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cliente ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                />
                {errors.cliente && <p className="text-xs text-red-600 mt-1">{errors.cliente}</p>}
              </div>

              {/* Cédula */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Cédula *</label>
                <input
                  name="cedula"
                  type="text"
                  placeholder="10 dígitos"
                  maxLength={10}
                  value={form.cedula}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cedula ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                />
                {errors.cedula && <p className="text-xs text-red-600 mt-1">{errors.cedula}</p>}
              </div>

              {/* N° factura */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">N° factura *</label>
                <input
                  name="factura"
                  type="text"
                  placeholder="FAC-001"
                  value={form.factura}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.factura ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                />
                {errors.factura && <p className="text-xs text-red-600 mt-1">{errors.factura}</p>}
              </div>

              {/* Fecha */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha *</label>
                <input
                  name="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fecha ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                />
                {errors.fecha && <p className="text-xs text-red-600 mt-1">{errors.fecha}</p>}
              </div>

              {/* Monto */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Monto ($) *</label>
                <input
                  name="monto"
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={form.monto}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.monto ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"}`}
                />
                {errors.monto && <p className="text-xs text-red-600 mt-1">{errors.monto}</p>}
              </div>

              {/* Estado */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Por Pagar">Por Pagar</option>
                  <option value="Pagado">Pagado</option>
                </select>
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Descripción / concepto</label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción opcional del servicio o producto..."
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarFactura}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Guardar factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Cliente", "Cédula", "N° factura", "Fecha", "Estado", "Monto", "Descripción", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                  No hay facturas aún. Agrega la primera con el botón de arriba.
                </td>
              </tr>
            ) : facturas.map(f => (
              <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{f.cliente}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{f.cedula}</td>
                <td className="px-5 py-3 text-slate-700">{f.factura}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtFecha(f.fecha)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    f.estado === "Pagado"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {f.estado}
                  </span>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-800">${f.monto.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 text-xs max-w-[180px] truncate">
                  {f.descripcion || "—"}
                </td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => eliminar(f.id)}
                    aria-label="Eliminar factura"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total pie de tabla */}
        {facturas.length > 0 && (
          <div className="flex justify-end gap-6 px-5 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">Total facturas: <strong className="text-slate-800 font-semibold">{facturas.length}</strong></span>
            <span className="text-slate-500">Monto total: <strong className="text-slate-800 font-semibold">${total.toLocaleString()}</strong></span>
            <span className="text-slate-500">Por cobrar: <strong className="text-red-600 font-semibold">${porCobrar.toLocaleString()}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}