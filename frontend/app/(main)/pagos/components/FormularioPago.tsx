"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/app/config";

type FormularioPagoProps = {
  onGuardado?: () => void;
};

export default function PagosPage({ onGuardado }: FormularioPagoProps) {
  const router = useRouter();
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

  const montoTotalCalculado = facturasSeleccionadas.reduce(
    (total, factura) => total + (Number(factura.montoAbonado) || 0),
    0,
  );

  const [clientes, setClientes] = useState<any[]>([]);

  const cargarClientes = async () => {
    try {
      const response = await fetch(`${API_URL}/facturas/clientes`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        const listClients = Array.isArray(data) ? data : [];
        const uniqueMap = new Map(listClients.map((c: any) => [c.cedula || c.ruc || c.nombre, c]));
        const sortedUniqueCleanClients = Array.from(uniqueMap.values())
          .filter((c: any) => c.nombre && c.nombre.trim() !== "" && c.nombre.trim() !== "undefined")
          .sort((a: any, b: any) => (a.nombre || "").localeCompare(b.nombre || ""));
        setClientes(sortedUniqueCleanClients);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setClientes([]);
    }
  };

  const cargarCuentasBancarias = async () => {
    try {
      const response = await fetch(`${API_URL}/cuentas-bancarias`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        const activas = data.filter((c: any) => c.estado?.toLowerCase() === "activo");
        setCuentasBancarias(activas);
        if (activas.length > 0) {
          setCuentaBancariaId(activas[0].id);
        }
      }
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "clienteId") {
      setFormData({ ...formData, clienteId: value });
      setFacturasSeleccionadas([]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const guardarPago = async () => {
    if (!cuentaBancariaId) {
      alert("Por favor, seleccione una cuenta bancaria.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const payload = {
        clienteId: formData.clienteId,
        cuentaBancariaId: cuentaBancariaId,
        descripcion: formData.descripcion,
        detalles: facturasSeleccionadas
          .filter((f) => Number(f.montoAbonado) > 0)
          .map((f) => ({
            facturaId: f.facturaId,
            montoPagado: Number(f.montoAbonado),
          })),
      };

      const response = await fetch(`${API_URL}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar el pago");
      }

      alert("Pago registrado correctamente");

      if (onGuardado) {
        onGuardado();
      }
      
      router.push("/pagos/reporte");
      router.refresh();
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cargarFacturas = async () => {
    try {
      const response = await fetch(`${API_URL}/pagos/facturas`, { cache: "no-store" });
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
          factura.facturaId === facturaId ? { ...factura, montoAbonado: montoStr } : factura
        )
      );
    } else {
      setFacturasSeleccionadas([
        ...facturasSeleccionadas,
        { facturaId, montoAbonado: montoStr }
      ]);
    }
  };

  useEffect(() => {
    cargarFacturas();
    cargarClientes();
    cargarCuentasBancarias();
  }, []);

  const facturasFiltradas = facturas.filter(
    (factura) => factura.clienteId === formData.clienteId && Number(factura.pendiente) > 0
  );

  // Validaciones para deshabilitar el botón
  const hayErrorMonto = facturasSeleccionadas.some((fs) => {
    const original = facturas.find((f) => f.id === fs.facturaId);
    return original && Number(fs.montoAbonado) > Number(original.pendiente);
  });
  
  const isSubmitDisabled = montoTotalCalculado === 0 || !cuentaBancariaId || hayErrorMonto || !formData.clienteId;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-2 bg-gray-50/50">
      {/* Tarjeta 1: Datos Generales */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-2">Datos Generales</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Fecha de Pago</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cuenta Bancaria de Destino</label>
            <select
              name="cuentaBancariaId"
              value={cuentaBancariaId}
              onChange={(e) => setCuentaBancariaId(e.target.value)}
              className="p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Seleccione una cuenta bancaria</option>
              {cuentasBancarias.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.entidadBancaria} - {cuenta.nombreCuenta}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Cliente</label>
          <select
            name="clienteId"
            value={formData.clienteId}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.cedula || cliente.ruc}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descripción del Pago</label>
          <textarea
            name="descripcion"
            rows={2}
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ej. Pago de mensualidad..."
            className="p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>

      {/* Tarjeta 2: Facturas Pendientes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-2">Facturas Pendientes</h2>
        
        {!formData.clienteId ? (
          <p className="text-gray-500 text-sm italic text-center py-4">Seleccione un cliente para ver sus facturas pendientes.</p>
        ) : facturasFiltradas.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">El cliente no tiene facturas pendientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Factura</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Total</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Pendiente</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 w-48 text-right whitespace-nowrap">Monto a Abonar</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((factura) => {
                  const sel = facturasSeleccionadas.find((fs) => fs.facturaId === factura.id);
                  const montoActual = sel?.montoAbonado ?? "";
                  const errorMonto = Number(montoActual) > Number(factura.pendiente);

                  return (
                    <tr key={factura.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-sm font-medium text-gray-700 whitespace-nowrap">{factura.id}</td>
                      <td className="p-3 text-sm text-gray-600 whitespace-nowrap">${Number(factura.total).toFixed(2)}</td>
                      <td className="p-3 text-sm font-semibold text-orange-600 whitespace-nowrap">${Number(factura.pendiente).toFixed(2)}</td>
                      <td className="p-3">
                        <div className="relative flex items-center justify-end">
                          <span className="absolute left-4 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={montoActual}
                            onChange={(e) => actualizarMonto(factura.id, e.target.value)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className={`w-full text-right pl-8 pr-3 py-1.5 border rounded-md outline-none transition-all text-sm ${
                              errorMonto 
                                ? "border-red-500 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-200" 
                                : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tarjeta 3: Resumen de Pago */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-2">Resumen de Pago</h2>
        
        <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-lg border border-blue-100">
          <span className="text-lg font-medium text-gray-700">Total a Pagar</span>
          <span className="text-3xl font-bold text-blue-600">
            ${montoTotalCalculado.toFixed(2)}
          </span>
        </div>

        <button
          onClick={guardarPago}
          disabled={isSubmitDisabled || isSubmitting}
          className={`w-full py-3 rounded-lg font-medium text-white transition-all shadow-sm mt-2 ${
            isSubmitDisabled || isSubmitting
              ? "bg-gray-400 cursor-not-allowed opacity-70"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-[0.99]"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
