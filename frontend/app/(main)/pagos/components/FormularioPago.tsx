"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import DatePicker from "@/app/components/DatePicker";
import { useRouter } from "next/navigation";
import { API_URL } from "@/app/config";
import { useToast } from "@/app/components/toast";

type FormularioPagoProps = {
  onGuardado?: () => void;
  pagoAEditar?: any;
};

export default function PagosPage({
  onGuardado,
  pagoAEditar,
}: FormularioPagoProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fecha: "",
    clienteId: "",
    descripcion: "",
  });
  const [cuentaBancariaId, setCuentaBancariaId] = useState("");
  const [cuentasBancarias, setCuentasBancarias] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<any[]>([]);

  useEffect(() => {
    if (pagoAEditar) {
      setFormData({
        fecha: pagoAEditar.fecha ? pagoAEditar.fecha.split("T")[0] : "",
        clienteId: pagoAEditar.clienteId || "",
        descripcion: pagoAEditar.descripcion || "",
      });
      setCuentaBancariaId(pagoAEditar.cuentaBancariaId || "");
      if (pagoAEditar.detalles) {
        setFacturasSeleccionadas(
          pagoAEditar.detalles.map((d: any) => ({
            facturaId: d.facturaId,
            montoAbonado: d.montoAbonado.toString(),
          })),
        );
      }
    }
  }, [pagoAEditar]);

  const montoTotalCalculado = facturasSeleccionadas.reduce(
    (total, factura) => total + (Number(factura.montoAbonado) || 0),
    0,
  );

  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cuentaDropdownOpen, setCuentaDropdownOpen] = useState(false);

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.nombre || "").toLowerCase().includes(term) ||
      (c.cedula || c.ruc || "").toLowerCase().includes(term)
    );
  });

  const cargarClientes = async () => {
    try {
      const response = await fetch(`${API_URL}/facturas/clientes`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        const listClients = Array.isArray(data) ? data : [];
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

  useEffect(() => {
    if (pagoAEditar && clientes.length > 0) {
      const client = clientes.find((c) => c.id === pagoAEditar.clienteId);
      if (client) {
        setSearchTerm(
          `${client.nombre} - ${client.cedula || client.ruc || ""}`,
        );
      }
    }
  }, [pagoAEditar, clientes]);

  const cargarCuentasBancarias = async () => {
    try {
      const response = await fetch(`${API_URL}/cuentas-bancarias`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        const activas = data.filter(
          (c: any) => c.estado?.toLowerCase() === "activo",
        );
        setCuentasBancarias(activas);
        if (activas.length > 0 && !pagoAEditar) {
          setCuentaBancariaId(activas[0].id);
        }
      }
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "clienteId") {
      setFormData({ ...formData, clienteId: value });
      setFacturasSeleccionadas([]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const guardarPago = async () => {
    if (!formData.clienteId) {
      showToast("Por favor, seleccione un cliente.", "error");
      return;
    }
    if (!formData.fecha) {
      showToast("Por favor, seleccione una fecha de pago.", "error");
      return;
    }
    if (!cuentaBancariaId) {
      showToast("Por favor, seleccione una cuenta bancaria.", "error");
      return;
    }
    if (!formData.descripcion.trim()) {
      showToast("Por favor, ingrese una descripción para el pago.", "error");
      return;
    }
    if (montoTotalCalculado === 0) {
      showToast("Por favor, ingrese un monto a abonar en al menos una factura.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        clienteId: formData.clienteId,
        cuentaBancariaId: cuentaBancariaId,
        descripcion: formData.descripcion,
        fecha: formData.fecha || undefined,
        detalles: facturasSeleccionadas
          .filter((f) => Number(f.montoAbonado) > 0)
          .map((f) => ({
            facturaId: f.facturaId,
            montoPagado: Number(f.montoAbonado),
          })),
      };

      const url = pagoAEditar
        ? `${API_URL}/pagos/${pagoAEditar.id}`
        : `${API_URL}/pagos`;
      const method = pagoAEditar ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar el pago");
      }

      showToast(
        pagoAEditar
          ? "Pago editado correctamente"
          : "Pago registrado correctamente",
        "success",
      );

      // Limpiar formulario
      setFormData({
        fecha: "",
        clienteId: "",
        descripcion: "",
      });
      setCuentaBancariaId("");
      setFacturasSeleccionadas([]);
      setFacturas([]);
      setSearchTerm("");

      if (onGuardado) {
        onGuardado();
      }

      setTimeout(() => {
        router.push("/pagos/reporte");
        router.refresh();
      }, 1500);

      router.refresh();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error al registrar el pago", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cargarFacturas = async () => {
    try {
      const response = await fetch(`${API_URL}/pagos/facturas`, {
        cache: "no-store",
      });
      const data = await response.json();
      setFacturas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFacturas([]);
    }
  };

  const actualizarMonto = (facturaId: string, montoStr: string) => {
    const facturaOriginal = facturas.find((f) => f.id === facturaId);
    if (!facturaOriginal) return;

    const exists = facturasSeleccionadas.find((f) => f.facturaId === facturaId);
    if (exists) {
      setFacturasSeleccionadas(
        facturasSeleccionadas.map((factura) =>
          factura.facturaId === facturaId
            ? { ...factura, montoAbonado: montoStr }
            : factura,
        ),
      );
    } else {
      setFacturasSeleccionadas([
        ...facturasSeleccionadas,
        { facturaId, montoAbonado: montoStr },
      ]);
    }
  };

  useEffect(() => {
    cargarClientes();
    cargarCuentasBancarias();
  }, []);

  useEffect(() => {
    if (formData.clienteId) {
      cargarFacturas();
    } else {
      setFacturas([]);
    }
  }, [formData.clienteId]);

  const facturasFiltradas = facturas
    .filter(
      (factura) =>
        factura.clienteId === formData.clienteId &&
        (factura.estado?.toUpperCase() === "PENDIENTE" ||
          factura.estado?.toUpperCase() === "SALDO_A_FAVOR" ||
          factura.estado?.toUpperCase() === "SALDO A FAVOR" ||
          Number(factura.pendiente) > 0 ||
          (pagoAEditar &&
            pagoAEditar.detalles?.some(
              (d: any) => d.facturaId === factura.id,
            ))),
    )
    .map((factura) => {
      let originalPendiente = Number(factura.pendiente);
      if (pagoAEditar) {
        // Si estamos editando, le sumamos el monto ya abonado por este pago para conocer el saldo pendiente original
        const allocated = pagoAEditar.detalles?.find(
          (d: any) =>
            d.facturaId === factura.id || d.facturaId === factura.facturaId,
        );
        if (allocated) {
          originalPendiente += Number(allocated.montoAbonado);
        }
      }
      return {
        ...factura,
        pendiente: originalPendiente,
      };
    });

  // Validaciones para deshabilitar el botón
  const hayErrorMonto = facturasSeleccionadas.some((fs) => {
    const original = facturasFiltradas.find((f) => f.id === fs.facturaId);
    return original && Number(fs.montoAbonado) > Number(original.pendiente);
  });

  const isSubmitDisabled =
    montoTotalCalculado === 0 ||
    !cuentaBancariaId ||
    hayErrorMonto ||
    !formData.clienteId ||
    !formData.fecha ||
    !formData.descripcion.trim();

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-2 bg-gray-50/50">
      {/* Tarjeta 1: Datos Generales */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-2">
          Datos Generales
        </h2>

        <div className="flex flex-col gap-1 relative">
          <label className="text-sm font-medium text-gray-700">Cliente <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Buscar cliente por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdownOpen(true);
              if (formData.clienteId) {
                setFormData({ ...formData, clienteId: "" });
                setFacturasSeleccionadas([]);
              }
            }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
            className="p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
          />
          {dropdownOpen && filteredClientes.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 top-full left-0">
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onMouseDown={() => {
                    setFormData({ ...formData, clienteId: cliente.id });
                    setSearchTerm(
                      `${cliente.nombre} - ${cliente.cedula || cliente.ruc || ""}`,
                    );
                    setDropdownOpen(false);
                  }}
                  className="p-2 hover:bg-red-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100 last:border-0"
                >
                  {cliente.nombre} - {cliente.cedula || cliente.ruc}
                </div>
              ))}
            </div>
          )}
          {formData.clienteId && (
            <span className="text-xs text-green-600 font-medium mt-1">
              Cliente seleccionado correctamente.
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label={<>Fecha de Pago <span className="text-red-500">*</span></>}
            value={formData.fecha}
            onChange={(v) => setFormData({ ...formData, fecha: v })}
          />

          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-semibold text-gray-600 mb-0.5">
              Cuenta Bancaria de Destino <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setCuentaDropdownOpen(!cuentaDropdownOpen)}
              onBlur={() => setTimeout(() => setCuentaDropdownOpen(false), 150)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-left outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors bg-white flex items-center justify-between gap-2"
            >
              <span className={cuentaBancariaId ? "text-gray-800 truncate" : "text-gray-400"}>
                {cuentaBancariaId
                  ? cuentasBancarias.find((c) => c.id === cuentaBancariaId)
                      ? `${cuentasBancarias.find((c) => c.id === cuentaBancariaId)?.entidadBancaria} — ${cuentasBancarias.find((c) => c.id === cuentaBancariaId)?.nombreCuenta}`
                      : "Seleccione una cuenta bancaria"
                  : "Seleccione una cuenta bancaria"}
              </span>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
              </svg>
            </button>
            {cuentaDropdownOpen && (
              <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                <div
                  onMouseDown={() => { setCuentaBancariaId(""); setCuentaDropdownOpen(false); }}
                  className="px-3 py-2.5 text-sm text-gray-400 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  Seleccione una cuenta bancaria
                </div>
                {cuentasBancarias.map((cuenta) => (
                  <div
                    key={cuenta.id}
                    onMouseDown={() => { setCuentaBancariaId(cuenta.id); setCuentaDropdownOpen(false); }}
                    className={`px-3 py-2.5 text-sm cursor-pointer transition-colors border-t border-gray-50 ${
                      cuentaBancariaId === cuenta.id
                        ? "bg-red-50 text-red-700 font-medium"
                        : "text-gray-700 hover:bg-red-50"
                    }`}
                  >
                    {cuenta.entidadBancaria} — {cuenta.nombreCuenta}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Descripción del Pago <span className="text-red-500">*</span>
          </label>
          <textarea
            name="descripcion"
            rows={2}
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ej. Pago de mensualidad..."
            className="p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>

      {/* Tarjeta 2: Facturas Pendientes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-2">
          Facturas Pendientes
        </h2>

        {!formData.clienteId ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            Seleccione un cliente para ver sus facturas pendientes.
          </p>
        ) : facturasFiltradas.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            El cliente no tiene facturas pendientes.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {facturasFiltradas.map((factura) => {
              const sel = facturasSeleccionadas.find(
                (fs) => fs.facturaId === factura.id,
              );
              const montoActual = sel?.montoAbonado ?? "";
              const errorMonto =
                Number(montoActual) > Number(factura.pendiente);

              return (
                <div
                  key={factura.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-150 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Factura</span>
                    <span className="text-sm font-semibold text-gray-800">{factura.id}</span>
                  </div>
                  
                  <div className="flex gap-6 sm:gap-10">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                      <span className="text-sm font-medium text-gray-600">${Number(factura.total).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pendiente</span>
                      <span className="text-sm font-bold text-orange-600">${Number(factura.pendiente).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:w-40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider sm:text-right">Monto a Abonar</span>
                    <div className="relative flex items-center justify-end">
                      <span className="absolute left-3 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={montoActual}
                        onChange={(e) =>
                          actualizarMonto(factura.id, e.target.value)
                        }
                        onWheel={(e) =>
                          (e.target as HTMLInputElement).blur()
                        }
                        className={`w-full text-right pl-7 pr-3 py-1.5 border rounded-lg outline-none transition-all text-sm ${
                          errorMonto
                            ? "border-red-500 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-200"
                            : "border-gray-300 bg-white focus:ring-2 focus:ring-red-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tarjeta 3: Resumen de Pago */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-2">
          Resumen de Pago
        </h2>

        <div className="flex items-center justify-between bg-red-50/50 p-4 rounded-lg border border-red-100">
          <span className="text-lg font-medium text-gray-700">
            Total a Pagar
          </span>
          <span className="metric-value text-red-700">
            ${montoTotalCalculado.toFixed(2)}
          </span>
        </div>

        <button
          onClick={guardarPago}
          disabled={isSubmitDisabled || isSubmitting}
          className={`w-full py-3 rounded-lg font-medium text-white transition-all shadow-sm mt-2 ${
            isSubmitDisabled || isSubmitting
              ? "bg-gray-400 cursor-not-allowed opacity-70"
              : "bg-[var(--utn-red)] hover:bg-[var(--utn-red-dark)] hover:shadow-md active:transform active:scale-[0.99]"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Procesando pago...
            </span>
          ) : hayErrorMonto ? (
            "Revise los montos ingresados"
          ) : (
            "Registrar Pago"
          )}
        </button>
      </div>
    </div>
  );
}
