"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback, useMemo } from "react";
import { API_URL } from "@/app/config";
import { useToast } from "@/app/components/toast";
import DataTable, { ColumnDef } from "@/app/components/DataTable";
import DatePicker from "@/app/components/DatePicker";
import { Landmark, DollarSign, FileText, Calendar, RefreshCw, CheckCircle2, X, ArrowRightLeft } from "lucide-react";

interface Cuenta {
  cuentaId: string;
  nombreBanco: string;
  numeroCuenta: string;
  saldo_cxc: number;
  saldo_facturacion: number;
  saldo_total: number;
}

export default function TransferenciasPage() {
  const { showToast } = useToast();

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [formData, setFormData] = useState({
    cuenta_origen_id: "",
    cuenta_destino_id: "",
    monto: "",
    descripcion: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar cuentas bancarias activas con sus saldos consolidados
  const cargarCuentas = useCallback(async () => {
    setLoadingCuentas(true);
    try {
      const headers: Record<string, string> = {};
      const token = sessionStorage.getItem("auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/dashboard/estado-cuenta/detalle`, {
        headers,
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setCuentas(data);
      } else {
        showToast("Error al cargar las cuentas bancarias con sus saldos", "error");
      }
    } catch (error) {
      console.error("Error al cargar cuentas:", error);
      showToast("Error de conexión al cargar cuentas bancarias", "error");
    } finally {
      setLoadingCuentas(false);
    }
  }, [showToast]);

  // Cargar historial de transferencias
  const cargarTransferencias = useCallback(async () => {
    setLoadingTransfers(true);
    try {
      const response = await fetch(`${API_URL}/movimientos/transferencias`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setTransferencias(data);
      }
    } catch (error) {
      console.error("Error al cargar historial de transferencias:", error);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    cargarCuentas();
    cargarTransferencias();
  }, [cargarCuentas, cargarTransferencias]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Validación reactiva de errores en tiempo real
  useEffect(() => {
    const nuevosErrores: Record<string, string> = {};
    const cuentaOrigen = cuentas.find((c) => c.cuentaId === formData.cuenta_origen_id);

    if (touched.cuenta_origen_id && !formData.cuenta_origen_id) {
      nuevosErrores.cuenta_origen_id = "Debe seleccionar una cuenta de origen";
    }

    if (touched.cuenta_destino_id && !formData.cuenta_destino_id) {
      nuevosErrores.cuenta_destino_id = "Debe seleccionar una cuenta de destino";
    }

    if (formData.cuenta_origen_id && formData.cuenta_destino_id && formData.cuenta_origen_id === formData.cuenta_destino_id) {
      nuevosErrores.cuenta_destino_id = "La cuenta de destino debe ser diferente a la de origen";
    }

    const montoNum = parseFloat(formData.monto);
    if (touched.monto) {
      if (!formData.monto) {
        nuevosErrores.monto = "El monto es obligatorio";
      } else if (isNaN(montoNum) || montoNum < 0.01) {
        nuevosErrores.monto = "El monto mínimo debe ser 0.01";
      } else if (cuentaOrigen && montoNum > cuentaOrigen.saldo_total) {
        nuevosErrores.monto = `El monto supera el saldo disponible (${formatCurrency(cuentaOrigen.saldo_total)})`;
      }
    }

    if (touched.descripcion && !formData.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria";
    }

    setErrores(nueves => {
      if (JSON.stringify(nueves) !== JSON.stringify(nuevosErrores)) {
        return nuevosErrores;
      }
      return nueves;
    });
  }, [formData, touched, cuentas]);

  // Verificar si el formulario es completamente válido para habilitar el botón
  const esFormularioValido = useMemo(() => {
    const cuentaOrigen = cuentas.find((c) => c.cuentaId === formData.cuenta_origen_id);
    if (!formData.cuenta_origen_id) return false;
    if (!formData.cuenta_destino_id) return false;
    if (formData.cuenta_origen_id === formData.cuenta_destino_id) return false;

    const montoNum = parseFloat(formData.monto);
    if (!formData.monto || isNaN(montoNum) || montoNum < 0.01) return false;
    if (cuentaOrigen && montoNum > cuentaOrigen.saldo_total) return false;

    if (!formData.descripcion.trim()) return false;

    return true;
  }, [formData, cuentas]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!esFormularioValido) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      cuenta_origen_id: formData.cuenta_origen_id,
      cuenta_destino_id: formData.cuenta_destino_id,
      monto: parseFloat(formData.monto),
      descripcion: formData.descripcion.trim(),
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const token = sessionStorage.getItem("auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/movimientos/transferencia`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast("Transferencia interna realizada con éxito", "success");
        setFormData({
          cuenta_origen_id: "",
          cuenta_destino_id: "",
          monto: "",
          descripcion: "",
        });
        setTouched({});
        setErrores({});
        setMostrarModal(false);
        await Promise.all([cargarCuentas(), cargarTransferencias()]);
      } else {
        const err = await response.json().catch(() => ({}));
        const msg = err?.message || "Error al registrar la transferencia";
        showToast(msg, "error");
      }
    } catch (error) {
      console.error("Error al registrar transferencia:", error);
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de fechas y mapeo de datos para DataTable
  const transferenciasFiltradas = useMemo(() => {
    return transferencias.filter((t) => {
      if ((fechaInicio || fechaFin) && t.created_at) {
        const d = new Date(t.created_at);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (fechaInicio && local < fechaInicio) return false;
        if (fechaFin && local > fechaFin) return false;
      }
      return true;
    });
  }, [transferencias, fechaInicio, fechaFin]);

  const transferenciasEnriquecidas = useMemo(() => {
    return transferenciasFiltradas.map((t) => {
      const cbOr = t.cuentas_bancarias_movimientos_cuenta_origen_idTocuentas_bancarias;
      const cbDest = t.cuentas_bancarias_movimientos_cuenta_destino_idTocuentas_bancarias;
      return {
        ...t,
        cuentaOrigenNombre: cbOr ? `${cbOr.entidad_bancaria} (${cbOr.nro_cuenta})` : "—",
        cuentaDestinoNombre: cbDest ? `${cbDest.entidad_bancaria} (${cbDest.nro_cuenta})` : "—",
        montoTexto: `${formatCurrency(Number(t.monto))}`,
        fechaTexto: t.created_at ? new Date(t.created_at).toLocaleDateString() : "—",
      };
    });
  }, [transferenciasFiltradas]);

  // Métricas
  const totalTransfers = transferenciasFiltradas.length;
  const montoTotal = transferenciasFiltradas.reduce((total, t) => total + Number(t.monto || 0), 0);

  // Columnas para DataTable
  const columns: ColumnDef<any>[] = [
    {
      key: "fechaTexto",
      label: "Fecha",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {row.fechaTexto}
        </div>
      ),
    },
    {
      key: "cuentaOrigenNombre",
      label: "Cuenta de Origen",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-800">{row.cuentaOrigenNombre}</span>
        </div>
      ),
    },
    {
      key: "cuentaDestinoNombre",
      label: "Cuenta de Destino",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-800 text-blue-600">{row.cuentaDestinoNombre}</span>
        </div>
      ),
    },
    {
      key: "descripcion",
      label: "Descripción",
      sortable: false,
      render: (row) => (
        <span className="text-xs text-gray-500 block max-w-sm truncate">{row.descripcion}</span>
      ),
    },
    {
      key: "montoTexto",
      label: "Monto",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900 text-right block w-full">{row.montoTexto}</span>
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
            <span className="text-gray-700 font-medium">Tesoreria</span>
            <span className="mx-1">/</span>
            <span className="text-gray-700 font-medium">Transferencias</span>
          </nav>
          <h1 className="page-title">Transferencias Internas</h1>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="inline-flex items-center gap-2 bg-[var(--utn-red)] hover:bg-[var(--utn-red-dark)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Nueva Transferencia
        </button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total transferencias", value: totalTransfers, color: "text-gray-900" },
          {
            label: "Monto total transferido",
            value: formatCurrency(montoTotal),
            color: "text-red-600",
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
        <h2 className="section-title mb-4">Filtrar por rango de fechas</h2>
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
            Mostrando <strong className="text-gray-700">{transferenciasFiltradas.length}</strong> de {transferencias.length} transferencias
          </p>
        )}
      </div>

      {/* ── DataTable ── */}
      <DataTable
        columns={columns}
        data={transferenciasEnriquecidas}
        rowKey={(row) => row.id}
        searchKeys={["descripcion", "cuentaOrigenNombre", "cuentaDestinoNombre"]}
        pageOptions={[5, 10, 25, 50]}
        emptyMessage="No existen transferencias registradas."
      />

      {/* ── Modal Nueva Transferencia ── */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-fadeIn">
            <div className="bg-[var(--utn-red)] px-6 py-5 flex items-center justify-between text-white">
              <h2 className="text-lg font-bold">Nueva Transferencia Interna</h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cuenta Origen */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-gray-400" />
                      Cuenta de Origen <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      name="cuenta_origen_id"
                      value={formData.cuenta_origen_id}
                      onChange={handleChange}
                      onBlur={() => handleBlur("cuenta_origen_id")}
                      disabled={loadingCuentas}
                      className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-sm bg-white ${
                        errores.cuenta_origen_id
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-red-500"
                      }`}
                    >
                      <option value="" disabled className="text-slate-400">
                        {loadingCuentas ? "Cargando cuentas..." : "Seleccione cuenta de origen"}
                      </option>
                      {cuentas.map((c) => (
                        <option key={c.cuentaId} value={c.cuentaId} className="text-slate-800">
                          {c.nombreBanco} ({c.numeroCuenta}) - Saldo: {formatCurrency(c.saldo_total)}
                        </option>
                      ))}
                    </select>
                    {errores.cuenta_origen_id && (
                      <span className="text-xs font-medium text-red-600">
                        {errores.cuenta_origen_id}
                      </span>
                    )}

                    {/* Tarjeta de Saldo Origen */}
                    {(() => {
                      const sel = cuentas.find((c) => c.cuentaId === formData.cuenta_origen_id);
                      if (!sel) return null;
                      return (
                        <div className="p-3 bg-white border-2 border-red-500 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn mt-1">
                          <div>
                            <h4 className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Saldo Disponible</h4>
                            <p className="text-[11px] text-red-700 font-medium truncate max-w-[150px]">{sel.nombreBanco}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-black text-red-600">
                              {formatCurrency(sel.saldo_total)}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Cuenta Destino */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-gray-400" />
                      Cuenta de Destino <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      name="cuenta_destino_id"
                      value={formData.cuenta_destino_id}
                      onChange={handleChange}
                      onBlur={() => handleBlur("cuenta_destino_id")}
                      disabled={loadingCuentas || !formData.cuenta_origen_id}
                      className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-sm bg-white ${
                        errores.cuenta_destino_id
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-red-500"
                      }`}
                    >
                      <option value="" disabled className="text-slate-400">
                        {loadingCuentas ? "Cargando cuentas..." : "Seleccione cuenta de destino"}
                      </option>
                      {cuentas
                        .filter((c) => c.cuentaId !== formData.cuenta_origen_id)
                        .map((c) => (
                          <option key={c.cuentaId} value={c.cuentaId} className="text-slate-800">
                            {c.nombreBanco} ({c.numeroCuenta}) - Saldo: {formatCurrency(c.saldo_total)}
                          </option>
                        ))}
                    </select>
                    {errores.cuenta_destino_id && (
                      <span className="text-xs font-medium text-red-600">
                        {errores.cuenta_destino_id}
                      </span>
                    )}

                    {/* Tarjeta de Saldo Destino */}
                    {(() => {
                      const sel = cuentas.find((c) => c.cuentaId === formData.cuenta_destino_id);
                      if (!sel) return null;
                      return (
                        <div className="p-3 bg-[var(--utn-red)] border border-red-700 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn mt-1 text-white">
                          <div>
                            <h4 className="text-[9px] font-bold text-red-100 uppercase tracking-wider">Saldo Actual</h4>
                            <p className="text-[11px] text-white font-medium truncate max-w-[150px]">{sel.nombreBanco}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-black text-white">
                              {formatCurrency(sel.saldo_total)}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monto */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      Monto a Transferir <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        name="monto"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={formData.monto}
                        onChange={handleChange}
                        onBlur={() => handleBlur("monto")}
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg outline-none transition-all text-sm bg-white ${
                          errores.monto
                            ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                            : "border-gray-300 focus:ring-2 focus:ring-red-500"
                        }`}
                      />
                    </div>
                    {errores.monto && (
                      <span className="text-xs font-medium text-red-600">
                        {errores.monto}
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-gray-400" />
                      Descripción <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="descripcion"
                      placeholder="Ej. Traspaso para pago de nómina"
                      value={formData.descripcion}
                      onChange={handleChange}
                      onBlur={() => handleBlur("descripcion")}
                      className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-sm bg-white ${
                        errores.descripcion
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-red-500"
                      }`}
                    />
                    {errores.descripcion && (
                      <span className="text-xs font-medium text-red-600">
                        {errores.descripcion}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón de Enviar */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !esFormularioValido}
                    className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm flex items-center gap-2 ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed opacity-70"
                        : !esFormularioValido
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-200"
                        : "bg-[var(--utn-red)] hover:bg-[var(--utn-red-dark)] hover:shadow-md active:transform active:scale-[0.98]"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 text-white" />
                        Procesando Transferencia...
                      </>
                    ) : esFormularioValido ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        Realizar Transferencia
                      </>
                    ) : (
                      "Complete todos los campos"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
