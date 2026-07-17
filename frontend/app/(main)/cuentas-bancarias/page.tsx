"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo } from "react";

import { API_URL } from "@/app/config";
import { useToast } from "@/app/components/toast";
import DataTable, { ColumnDef } from "@/app/components/DataTable";

export default function CuentasBancariasPage() {
  const { showToast } = useToast();

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
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cuentaEliminar, setCuentaEliminar] = useState<string | null>(null);

  const cargarCuentas = async () => {
    try {
      const response = await fetch(`${API_URL}/cuentas-bancarias?all=true`);
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

  // ── Reglas de validación ────────────────────────────────────────────────
  const validarCampo = useCallback((name: string, value: string): string => {
    switch (name) {
      case "nombreCuenta":
        if (!value.trim()) return "El nombre de la cuenta es obligatorio";
        if (value.trim().length < 3) return "Mínimo 3 caracteres";
        if (value.trim().length > 100) return "Máximo 100 caracteres";
        return "";
      case "entidadBancaria":
        if (!value.trim()) return "La entidad bancaria es obligatoria";
        if (value.trim().length < 3) return "Mínimo 3 caracteres";
        return "";
      case "titular":
        if (!value.trim()) return "El titular es obligatorio";
        if (value.trim().length < 3) return "Mínimo 3 caracteres";
        return "";
      case "nroCuenta":
        if (!value.trim()) return "El número de cuenta es obligatorio";
        if (!/^\d{8,20}$/.test(value.trim())) return "Debe contener entre 8 y 20 dígitos numéricos";
        const existe = cuentas.some(
          (c) => c.nroCuenta?.trim() === value.trim() && c.id !== editandoId
        );
        if (existe) return "Este número de cuenta ya está registrado";
        return "";
      case "ruc":
        if (!value.trim()) return "El RUC es obligatorio";
        if (!/^\d{13}$/.test(value.trim()))
          return "El RUC debe tener exactamente 13 dígitos";
        return "";
      case "codigo":
        if (value && !/^[A-Za-z0-9\-_]{2,20}$/.test(value.trim()))
          return "Solo letras, números, guiones (máx. 20 caracteres)";
        return "";
      default:
        return "";
    }
  }, [cuentas, editandoId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrores((prev) => ({ ...prev, [name]: validarCampo(name, value) }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrores((prev) => ({ ...prev, [name]: validarCampo(name, value) }));
  };

  const validarTodo = (): boolean => {
    const campos = [
      "nombreCuenta",
      "entidadBancaria",
      "titular",
      "nroCuenta",
      "ruc",
    ];
    const nuevosErrores: Record<string, string> = {};
    const nuevosTouched: Record<string, boolean> = {};
    campos.forEach((campo) => {
      nuevosTouched[campo] = true;
      nuevosErrores[campo] = validarCampo(
        campo,
        (formData as any)[campo] ?? "",
      );
    });
    setTouched(nuevosTouched);
    setErrores(nuevosErrores);
    return Object.values(nuevosErrores).every((e) => !e);
  };

  const formularioValido = useMemo(() => {
    if (!formData.nombreCuenta.trim()) return false;
    if (!formData.entidadBancaria.trim()) return false;
    if (!formData.titular.trim()) return false;
    if (!formData.nroCuenta.trim()) return false;
    if (!formData.ruc.trim()) return false;

    // Check if there are any non-empty errors
    const tieneErrores = Object.values(errores).some((e) => e !== "");
    if (tieneErrores) return false;
    return true;
  }, [formData, errores]);


  const abrirModalNueva = () => {
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
    setErrores({});
    setTouched({});
    setMostrarModal(true);
  };

  const guardarCuenta = async () => {
    if (!validarTodo()) {
      showToast("Corrija los errores antes de guardar", "error");
      return;
    }

    setGuardando(true);
    const payload: any = {
      nombreCuenta: formData.nombreCuenta.trim(),
      entidadBancaria: formData.entidadBancaria.trim(),
      titular: formData.titular.trim(),
      tipoCuenta: formData.tipoCuenta,
      nroCuenta: formData.nroCuenta.trim(),
      ruc: formData.ruc.trim(),
      descripcion: formData.descripcion.trim(),
      estado: formData.estado ? "ACTIVO" : "INACTIVO",
    };

    if (formData.codigo && formData.codigo.trim()) {
      payload.codigo = formData.codigo.trim();
    }

    try {
      let response;
      if (editandoId) {
        response = await fetch(`${API_URL}/cuentas-bancarias/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_URL}/cuentas-bancarias`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: `CB-${Date.now()}`, ...payload }),
        });
      }

      if (response.ok) {
        await cargarCuentas();
        setEditandoId(null);
        setMostrarModal(false);
        setErrores({});
        setTouched({});
        showToast(
          editandoId
            ? "Cuenta bancaria actualizada correctamente"
            : "Cuenta bancaria registrada correctamente",
          "success",
        );
      } else {
        const err = await response.json().catch(() => ({}));
        const msg = err?.message || "Error al guardar la cuenta bancaria";
        showToast(msg, "error");
      }
    } catch (error) {
      console.error(error);
      showToast(
        "Error de conexión. Verifique que el servidor esté activo.",
        "error",
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarCuenta = (cuenta: any) => {
    setFormData({
      codigo: cuenta.codigo || "",
      nombreCuenta: cuenta.nombreCuenta || "",
      entidadBancaria: cuenta.entidadBancaria || "",
      titular: cuenta.titular || "",
      tipoCuenta: cuenta.tipoCuenta || "Corriente",
      nroCuenta: cuenta.nroCuenta || "",
      ruc: cuenta.ruc || "",
      descripcion: cuenta.descripcion || "",
      estado: cuenta.estado === "ACTIVO",
    });
    setErrores({});
    setTouched({});
    setEditandoId(cuenta.id);
    setMostrarModal(true);
  };

  const eliminarCuenta = (id: string) => {
    setCuentaEliminar(id);
    setMostrarConfirmacion(true);
  };
  const confirmarEliminar = async () => {
    if (!cuentaEliminar) return;

    try {
      const response = await fetch(
        `${API_URL}/cuentas-bancarias/${cuentaEliminar}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok || response.status === 204) {
        await cargarCuentas();
        showToast("Cuenta bancaria eliminada correctamente", "success");
      } else {
        showToast("Error al eliminar la cuenta bancaria", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setMostrarConfirmacion(false);
      setCuentaEliminar(null);
    }
  };

  // ── Definición de columnas para DataTable ────────────────────────────────
  const columns: ColumnDef<any>[] = [
    {
      key: "acciones",
      label: "Acciones",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => editarCuenta(row)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => eliminarCuenta(row.id)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 active:scale-[0.98] transition-all"
          >
            Eliminar
          </button>
        </div>
      ),
    },
    {
      key: "codigo",
      label: "Código",
      sortable: true,
    },
    {
      key: "nombreCuenta",
      label: "Nombre Cuenta",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.nombreCuenta}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.tipoCuenta}</p>
        </div>
      ),
    },
    {
      key: "entidadBancaria",
      label: "Banco",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.entidadBancaria}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.titular}</p>
        </div>
      ),
    },
    {
      key: "nroCuenta",
      label: "Nro. Cuenta",
      sortable: false,
      render: (row) => (
        <div className="text-xs">
          <p className="text-gray-900">{row.nroCuenta}</p>
          <p className="text-gray-500">RUC: {row.ruc}</p>
        </div>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      render: (row) => {
        const esActivo = row.estado === "ACTIVO";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              esActivo
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {esActivo ? "Activo" : "Inactivo"}
          </span>
        );
      },
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
            <span className="text-gray-700 font-medium">Cuentas Bancarias</span>
          </nav>
          <h1 className="page-title">Cuentas Bancarias</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Administración de cuentas bancarias de la empresa
          </p>
        </div>
        <button
          type="button"
          onClick={abrirModalNueva}
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
          Nueva Cuenta
        </button>
      </div>

      {/* ── DataTable ── */}
      <DataTable
        columns={columns}
        data={cuentas}
        rowKey={(row) => row.id}
        searchKeys={[
          "codigo",
          "nombreCuenta",
          "entidadBancaria",
          "titular",
          "nroCuenta",
          "ruc",
        ]}
        pageOptions={[5, 10, 25, 50]}
        emptyMessage="No hay cuentas bancarias registradas."
      />

      {/* ── Modal Nueva / Editar Cuenta ── */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[var(--utn-red)] px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h2 className="text-lg font-bold">
                  {editandoId
                    ? "Editar Cuenta Bancaria"
                    : "Nueva Cuenta Bancaria"}
                </h2>
                <p className="text-xs text-red-100 mt-0.5">
                  Los campos marcados con * son obligatorios
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
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

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Nombre Cuenta */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nombre Cuenta <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="nombreCuenta"
                    value={formData.nombreCuenta}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej. Cuenta Corriente Principal"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
                      errores.nombreCuenta && touched.nombreCuenta
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    }`}
                  />
                  {errores.nombreCuenta && touched.nombreCuenta && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errores.nombreCuenta}
                    </p>
                  )}
                </div>

                {/* Entidad Bancaria */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Entidad Bancaria <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="entidadBancaria"
                    value={formData.entidadBancaria}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej. Banco Pichincha"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
                      errores.entidadBancaria && touched.entidadBancaria
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    }`}
                  />
                  {errores.entidadBancaria && touched.entidadBancaria && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errores.entidadBancaria}
                    </p>
                  )}
                </div>

                {/* Titular */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Titular <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="titular"
                    value={formData.titular}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej. Universidad Técnica del Norte"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
                      errores.titular && touched.titular
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    }`}
                  />
                  {errores.titular && touched.titular && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errores.titular}
                    </p>
                  )}
                </div>

                {/* Tipo de Cuenta */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Tipo de Cuenta
                  </label>
                  <select
                    name="tipoCuenta"
                    value={formData.tipoCuenta}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors"
                  >
                    <option value="Corriente">Corriente</option>
                    <option value="Ahorros">Ahorros</option>
                  </select>
                </div>

                {/* Número de Cuenta */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Número de Cuenta <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="nroCuenta"
                    value={formData.nroCuenta}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej. 2100456789"
                    maxLength={20}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
                      errores.nroCuenta && touched.nroCuenta
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    }`}
                  />
                  {errores.nroCuenta && touched.nroCuenta && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errores.nroCuenta}
                    </p>
                  )}
                </div>

                {/* RUC */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    RUC <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="ruc"
                    value={formData.ruc}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej. 1790011223001"
                    maxLength={13}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
                      errores.ruc && touched.ruc
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    }`}
                  />
                  {errores.ruc && touched.ruc && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errores.ruc}
                    </p>
                  )}
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2 self-end pb-1">
                  <input
                    type="checkbox"
                    id="estado_chk"
                    checked={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.checked })
                    }
                    className="w-4 h-4 rounded cursor-pointer accent-red-700"
                  />
                  <label
                    htmlFor="estado_chk"
                    className="text-sm text-gray-700 font-medium cursor-pointer"
                  >
                    Cuenta Activa
                  </label>
                </div>

                {/* Descripción */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción opcional..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCuenta}
                disabled={guardando || !formularioValido}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--utn-red)] hover:bg-[var(--utn-red-dark)] text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {guardando ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-red-700 px-6 py-5 text-white">
              <h2 className="text-lg font-bold">Confirmar eliminación</h2>
            </div>

            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    className="w-9 h-9 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-center text-gray-700">
                ¿Está seguro de eliminar esta cuenta bancaria?
              </p>

              <p className="text-center text-sm text-gray-500 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50">
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setCuentaEliminar(null);
                }}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarEliminar}
                className="px-5 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
