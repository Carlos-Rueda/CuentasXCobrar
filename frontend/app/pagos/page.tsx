"use client";

import { useState, useCallback } from "react";

// ─── Tipo ────────────────────────────────────────────────────────────────────
type Cliente = {
  cedula: string;
  nombre: string;
  correo: string;
  telefono: string;
};

// ─── Datos quemados (reemplazar por llamada a la API cuando esté lista) ───────
const CLIENTES_MOCK: Cliente[] = [
  { cedula: "0912345678", nombre: "Juan Pérez",    correo: "juan@gmail.com",   telefono: "0999999999" },
  { cedula: "0923456789", nombre: "María López",   correo: "maria@gmail.com",  telefono: "0988888888" },
  { cedula: "0934567890", nombre: "Carlos Vera",   correo: "carlos@gmail.com", telefono: "0977777777" },
];

// ─── Función de búsqueda (cuando llegue la API, solo cambia esta función) ─────
async function fetchCliente(cedula: string): Promise<Cliente | null> {
  // TODO: reemplazar con llamada real cuando el otro grupo entregue la API
  // const res = await fetch(`http://localhost:3001/clientes/${cedula}`);
  // if (!res.ok) return null;
  // return res.json();

  // Simulación con datos quemados
  const encontrado = CLIENTES_MOCK.find(c => c.cedula === cedula);
  return encontrado ?? null;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function PagosPage() {
  // Estado de búsqueda
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  // Datos del cliente (readonly tras búsqueda)
  const [nombre,   setNombre]   = useState("");
  const [correo,   setCorreo]   = useState("");
  const [telefono, setTelefono] = useState("");
  const [clienteOk, setClienteOk] = useState(false);

  // Datos del cobro
  const [factura,     setFactura]     = useState("");
  const [fecha,       setFecha]       = useState("");
  const [monto,       setMonto]       = useState("");
  const [observacion, setObservacion] = useState("");

  // ── Buscar cliente ──────────────────────────────────────────────────────────
  const buscarCliente = useCallback(async () => {
    const cedula = cedulaBusqueda.trim();

    // Validación de cédula antes de buscar
    if (!cedula) {
      setErrorBusqueda("Ingrese un número de cédula");
      return;
    }
    if (!/^\d{10}$/.test(cedula)) {
      setErrorBusqueda("La cédula debe tener exactamente 10 dígitos numéricos");
      return;
    }

    setErrorBusqueda("");
    setBuscando(true);
    setClienteOk(false);

    try {
      const cliente = await fetchCliente(cedula);

      if (cliente) {
        setNombre(cliente.nombre);
        setCorreo(cliente.correo);
        setTelefono(cliente.telefono);
        setClienteOk(true);
      } else {
        setNombre("");
        setCorreo("");
        setTelefono("");
        setErrorBusqueda(`No se encontró ningún cliente con cédula ${cedula}`);
      }
    } catch (err) {
      console.error("Error al buscar cliente:", err);
      setErrorBusqueda("Error de conexión. Intente nuevamente.");
    } finally {
      setBuscando(false);
    }
  }, [cedulaBusqueda]);

  // Buscar también al presionar Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") buscarCliente();
  };

  // ── Registrar cobro ─────────────────────────────────────────────────────────
  const registrarCobro = async () => {
    if (!clienteOk) {
      alert("Primero busque y verifique un cliente válido");
      return;
    }
    if (!factura || !fecha || !monto) {
      alert("Complete todos los campos obligatorios del cobro");
      return;
    }
    if (Number(monto) <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    const cobro = {
      cliente:    nombre,
      cedula:     cedulaBusqueda.trim(),
      correo,
      telefono,
      factura,
      fecha,
      monto:      Number(monto),
      observacion,
    };

    console.log("Cobro a registrar:", cobro);

    // TODO: cuando llegue la API del otro grupo, enviar el cobro:
    // const res = await fetch("http://localhost:3001/cobros", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(cobro),
    // });

    alert("Cobro registrado correctamente ✓");

    // Limpiar formulario
    setCedulaBusqueda("");
    setNombre("");
    setCorreo("");
    setTelefono("");
    setClienteOk(false);
    setFactura("");
    setFecha("");
    setMonto("");
    setObservacion("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-800 mb-8">Cobros</h1>

      {/* ── Buscar Cliente ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-5">Buscar Cliente</h2>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Ingrese la cédula (10 dígitos)"
            value={cedulaBusqueda}
            onChange={(e) => {
              setCedulaBusqueda(e.target.value);
              setErrorBusqueda("");  // limpiar error al escribir
              setClienteOk(false);  // resetear cliente si el usuario cambia la cédula
              setNombre("");
              setCorreo("");
              setTelefono("");
            }}
            onKeyDown={handleKeyDown}
            maxLength={10}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            onClick={buscarCliente}
            disabled={buscando}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {/* Mensaje de error de búsqueda */}
        {errorBusqueda && (
          <p className="mt-3 text-sm text-red-600 font-medium">{errorBusqueda}</p>
        )}

        {/* Confirmación de cliente encontrado */}
        {clienteOk && (
          <p className="mt-3 text-sm text-emerald-600 font-medium">✓ Cliente encontrado</p>
        )}
      </div>

      {/* ── Datos del Cliente ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-5">Datos del Cliente</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              readOnly
              placeholder="Se llenará al buscar"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Correo</label>
            <input
              type="text"
              value={correo}
              readOnly
              placeholder="Se llenará al buscar"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
            <input
              type="text"
              value={telefono}
              readOnly
              placeholder="Se llenará al buscar"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cédula</label>
            <input
              type="text"
              value={cedulaBusqueda}
              readOnly
              placeholder="Se llenará al buscar"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* ── Datos del Cobro ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-5">Datos del Cobro</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Número de Factura *</label>
            <input
              type="text"
              placeholder="Ej: FAC-001"
              value={factura}
              onChange={(e) => setFactura(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Monto ($) *</label>
            <input
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Observación</label>
            <textarea
              placeholder="Observaciones adicionales (opcional)"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={registrarCobro}
            disabled={!clienteOk}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Registrar Cobro
          </button>
          {!clienteOk && (
            <p className="mt-2 text-xs text-slate-400">Busque un cliente válido antes de registrar el cobro</p>
          )}
        </div>
      </div>
    </div>
  );
}