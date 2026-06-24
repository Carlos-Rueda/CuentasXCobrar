"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react";
import { API_URL } from "@/app/config";

export default function CuentasBancariasPage() {
  const [formData, setFormData] = useState({
    codigo: "",
    nombreCuenta: "",
    entidadBancaria: "",
    titular: "",
    tipoCuenta: "Corriente",
    nroCuenta: "",
    ruc: "",
    descripcion: "",
    estado: true,
  });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cuentas, setCuentas] = useState<any[]>([]);

  // Estados de filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroBanco, setFiltroBanco] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  const cargarCuentas = async () => {
    try {
      const response = await fetch(`${API_URL}/cuentas-bancarias`);
      if (response.ok) {
        const data = await response.json();
        setCuentas(data);
      }
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  // Extraer bancos disponibles para el filtro dinámico
  const bancosDisponibles = useMemo(() => {
    const listaBancos = cuentas.map((c) => c.entidadBancaria).filter(Boolean);
    return Array.from(new Set(listaBancos)) as string[];
  }, [cuentas]);

  // Filtrado de cuentas en memoria
  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter((cuenta) => {
      const matchTexto =
        !filtroTexto.trim() ||
        cuenta.codigo?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        cuenta.nombreCuenta?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        cuenta.titular?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        cuenta.nroCuenta?.toLowerCase().includes(filtroTexto.toLowerCase());

      const matchBanco =
        !filtroBanco || cuenta.entidadBancaria === filtroBanco;

      const matchEstado =
        filtroEstado === "TODOS" || cuenta.estado === filtroEstado;

      const matchTipo =
        filtroTipo === "TODOS" || cuenta.tipoCuenta === filtroTipo;

      return matchTexto && matchBanco && matchEstado && matchTipo;
    });
  }, [cuentas, filtroTexto, filtroBanco, filtroEstado, filtroTipo]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroBanco("");
    setFiltroEstado("TODOS");
    setFiltroTipo("TODOS");
  };

  const guardarCuenta = async () => {
    if (
      !formData.nombreCuenta ||
      !formData.entidadBancaria ||
      !formData.titular ||
      !formData.nroCuenta ||
      !formData.ruc
    ) {
      alert("Por favor rellene los campos obligatorios");
      return;
    }

    const payload = {
      codigo: formData.codigo,
      nombreCuenta: formData.nombreCuenta,
      entidadBancaria: formData.entidadBancaria,
      titular: formData.titular,
      tipoCuenta: formData.tipoCuenta,
      nroCuenta: formData.nroCuenta,
      ruc: formData.ruc,
      descripcion: formData.descripcion,
      estado: formData.estado ? "ACTIVO" : "INACTIVO",
    };

    try {
      let response;
      if (editandoId) {
        response = await fetch(
          `${API_URL}/cuentas-bancarias/${editandoId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        response = await fetch(
          `${API_URL}/cuentas-bancarias`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: `CB-${Date.now()}`,
              ...payload
            }),
          },
        );
      }

      if (response.ok) {
        await cargarCuentas();
        setFormData({
          codigo: "",
          nombreCuenta: "",
          entidadBancaria: "",
          titular: "",
          tipoCuenta: "Corriente",
          nroCuenta: "",
          ruc: "",
          descripcion: "",
          estado: true,
        });
        setEditandoId(null);
        setMostrarModal(false);
        alert(
          editandoId
            ? "Cuenta bancaria actualizada correctamente"
            : "Cuenta bancaria guardada correctamente",
        );
      } else {
        alert("Error al guardar la cuenta bancaria");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  const editarCuenta = (cuenta: any) => {
    setFormData({
      codigo: cuenta.codigo,
      nombreCuenta: cuenta.nombreCuenta,
      entidadBancaria: cuenta.entidadBancaria,
      titular: cuenta.titular || "",
      tipoCuenta: cuenta.tipoCuenta || "Corriente",
      nroCuenta: cuenta.nroCuenta || "",
      ruc: cuenta.ruc || "",
      descripcion: cuenta.descripcion || "",
      estado: cuenta.estado === "ACTIVO",
    });
    setEditandoId(cuenta.id);
    setMostrarModal(true);
  };

  const inactivarCuenta = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta cuenta bancaria?")) return;
    try {
      const response = await fetch(`${API_URL}/cuentas-bancarias/${id}`, {
        method: "DELETE"
      });
      if (response.ok || response.status === 204) {
        await cargarCuentas();
        alert("Cuenta bancaria eliminada correctamente");
      } else {
        alert("Error al eliminar la cuenta bancaria");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Encabezado de página ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">
            Cuentas Bancarias
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administración, registro y visualización de las cuentas bancarias de la empresa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditandoId(null);
            setFormData({
              codigo: "",
              nombreCuenta: "",
              entidadBancaria: "",
              titular: "",
              tipoCuenta: "Corriente",
              nroCuenta: "",
              ruc: "",
              descripcion: "",
              estado: true,
            });
            setMostrarModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          + Registrar cuenta
        </button>
      </div>

      {/* ── Panel de Filtros de Búsqueda (Diseño Premium) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Filtros de Búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Búsqueda General */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Búsqueda General</label>
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por código, nombre, titular o nro..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Filtro Banco */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Banco</label>
            <select
              value={filtroBanco}
              onChange={(e) => setFiltroBanco(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            >
              <option value="">Todos los bancos</option>
              {bancosDisponibles.map((banco) => (
                <option key={banco} value={banco}>
                  {banco}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo de Cuenta */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo de Cuenta</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="Corriente">Corriente</option>
              <option value="Ahorros">Ahorros</option>
            </select>
          </div>

          {/* Filtro Estado */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
        </div>

        {(filtroTexto || filtroBanco || filtroEstado !== "TODOS" || filtroTipo !== "TODOS") && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline font-semibold"
            >
              Limpiar Filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Tabla de cuentas bancarias (Diseño Stacked Profesional sin Desplazamiento) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[12%]">Código</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[23%]">Cuenta</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[25%]">Banco / Titular</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[20%]">Datos Cuenta</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[25%]">Descripción</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[10%]">Estado</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-[15%]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuentasFiltradas.length > 0 ? (
                cuentasFiltradas.map((cuenta) => (
                  <tr key={cuenta.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Código */}
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {cuenta.codigo}
                    </td>

                    {/* Cuenta */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 break-words leading-tight">{cuenta.nombreCuenta}</span>
                        <span className="text-xs text-slate-400 mt-1 font-medium italic">{cuenta.tipoCuenta}</span>
                      </div>
                    </td>

                    {/* Banco / Titular */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 break-words leading-tight">{cuenta.entidadBancaria}</span>
                        <span className="text-xs text-slate-400 mt-1 break-words">{cuenta.titular}</span>
                      </div>
                    </td>

                    {/* Datos Cuenta */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 font-mono text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-sans font-semibold">Nro:</span>
                          <span className="text-slate-700 font-semibold">{cuenta.nroCuenta}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-sans font-semibold">RUC:</span>
                          <span className="text-slate-500">{cuenta.ruc}</span>
                        </div>
                      </div>
                    </td>

                    {/* Descripción */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-slate-500 break-words leading-relaxed max-w-[240px] line-clamp-2 cursor-help" title={cuenta.descripcion}>
                        {cuenta.descripcion || <span className="text-slate-300 italic">Sin descripción</span>}
                      </p>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold leading-none ${
                          cuenta.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cuenta.estado === "ACTIVO" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {cuenta.estado}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-3 text-sm">
                      <button
                        type="button"
                        onClick={() => editarCuenta(cuenta)}
                        className="text-emerald-600 hover:text-emerald-800 hover:underline font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => inactivarCuenta(cuenta.id)}
                        className="text-red-600 hover:text-red-800 hover:underline font-semibold"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                    No hay cuentas bancarias que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Nueva / Editar Cuenta ── */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h2 className="text-lg font-bold">
                  {editandoId ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
                </h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Complete los datos obligatorios marcados con asterisco (*)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Nombre Cuenta */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre Cuenta *</label>
                  <input
                    name="nombreCuenta"
                    value={formData.nombreCuenta}
                    onChange={handleChange}
                    placeholder="e.g. Cuenta Corriente"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Entidad Bancaria */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Entidad Bancaria *</label>
                  <input
                    name="entidadBancaria"
                    value={formData.entidadBancaria}
                    onChange={handleChange}
                    placeholder="e.g. Banco Pichincha"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Titular */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Titular de la Cuenta *</label>
                  <input
                    name="titular"
                    value={formData.titular}
                    onChange={handleChange}
                    placeholder="e.g. Empresa Integrador S.A."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Tipo de Cuenta */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo de Cuenta *</label>
                  <select
                    name="tipoCuenta"
                    value={formData.tipoCuenta}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  >
                    <option value="Corriente">Corriente</option>
                    <option value="Ahorros">Ahorros</option>
                  </select>
                </div>

                {/* Número de Cuenta */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Número de Cuenta *</label>
                  <input
                    name="nroCuenta"
                    value={formData.nroCuenta}
                    onChange={handleChange}
                    placeholder="e.g. 2100456789"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* RUC Asociado */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">RUC Asociado *</label>
                  <input
                    name="ruc"
                    value={formData.ruc}
                    onChange={handleChange}
                    placeholder="e.g. 1790011223001"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Descripción */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción opcional de la cuenta..."
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Estado Checkbox */}
                <div className="col-span-2 flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    name="estado"
                    id="estado_chk"
                    checked={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-200 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="estado_chk" className="text-sm text-slate-600 font-medium cursor-pointer select-none">
                    Cuenta Activa
                  </label>
                </div>
              </div>

              {/* Guardar Button */}
              <button
                type="button"
                onClick={guardarCuenta}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm mt-2"
              >
                Guardar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
