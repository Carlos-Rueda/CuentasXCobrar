"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import FormularioPago from "../components/FormularioPago";
import { API_URL } from "@/app/config";

export default function ReportePagosPage() {
  interface CuentaBancaria {
    id: string;
    codigo: string;
    nombreCuenta: string;
    entidadBancaria: string;
    descripcion?: string;
    estado: string;
    clienteId?: string;
  }

  const [pagos, setPagos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pagoEditar, setPagoEditar] = useState<any>(null);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  const anularPago = async (id: string) => {
    if (!confirm("¿Está seguro de que desea anular este pago?")) return;
    try {
      const response = await fetch(`${API_URL}/pagos/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Pago anulado correctamente.");
        cargarPagos();
      } else {
        const err = await response.json();
        alert(`Error al anular el pago: ${err.message || response.statusText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    }
  };

  const cargarPagos = async () => {
    try {
      const response = await fetch(`${API_URL}/pagos/reporte`);

      const data = await response.json();

      setPagos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setPagos([]);
    }
  };

  const descargarPDFPago = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/pagos/${id}/pdf`);
      if (!response.ok) {
        alert("No se pudo descargar el PDF de este pago.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Comprobante-Pago-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor para descargar el PDF.");
    }
  };

  const pagosFiltrados = pagos.filter((pago) => {
    if (filtroCliente && pago.clienteId !== filtroCliente) {
      return false;
    }
    
    if (!busqueda) return true;

    const cliente = clientes.find((c) => c.id === pago.clienteId);
    const searchLower = busqueda.toLowerCase();
    
    const matchesNumeroPago = (pago.numeroPago || "").toLowerCase().includes(searchLower);
    const matchesNombre = (cliente?.nombre || "").toLowerCase().includes(searchLower);
    const matchesCedula = (cliente?.cedula || cliente?.ruc || "").toLowerCase().includes(searchLower);

    return matchesNumeroPago || matchesNombre || matchesCedula;
  });

  const totalPagos = pagosFiltrados.length;

  const montoTotal = pagosFiltrados.reduce(
    (total, pago) => total + Number(pago.montoTotal),
    0,
  );

  const cargarCuentasBancarias = async () => {
    try {
      const response = await fetch(`${API_URL}/cuentas-bancarias`);
      if (response.ok) {
        const data = await response.json();
        setCuentasBancarias(data);
      }
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await fetch(`${API_URL}/facturas/clientes`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        const listClients = Array.isArray(data) ? data : [];
        // Filtrar basura, deduplicar por cédula/RUC y ordenar alfabéticamente de la A a la Z
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

  useEffect(() => {
    cargarPagos();
    cargarClientes();
    cargarCuentasBancarias();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.titleSection}>
          <h1>Pagos</h1>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span>Total pagos</span>
            <strong>{totalPagos}</strong>
          </div>

          <div className={styles.statCard}>
            <span>Monto recaudado</span>
            <strong>${montoTotal}</strong>
          </div>
        </div>

        <div className={styles.actions} style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Buscar por Nº pago, cliente o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm w-full max-w-xs md:max-w-md transition-all"
          />
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#fff",
              fontSize: "14px",
              outline: "none",
              minWidth: "200px"
            }}
          >
            <option value="">Buscar por cliente (Todos)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} - {c.cedula || c.ruc}
              </option>
            ))}
          </select>
          <button
            className={styles.newButton}
            onClick={() => setMostrarModal(true)}
          >
            + Nuevo Pago
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Cuenta Bancaria de Destino</th>
                <th>Monto Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pagosFiltrados.length > 0 ? (
                pagosFiltrados.map((pago) => {
                  const isActivo = pago.estado?.toLowerCase() === "activo" || pago.estado?.toLowerCase() === "impreso";
                  const isInactivo = pago.estado?.toLowerCase() === "inactivo";

                  const disableEdit = isActivo;
                  const disablePdf = false;

                  return (
                    <tr key={pago.id}>
                      <td>{pago.numeroPago}</td>

                      <td>
                        {clientes.find((cliente) => cliente.id === pago.clienteId)
                          ?.nombre || pago.clienteId}
                      </td>

                      <td>
                        {pago.cuentaBancariaId && cuentasBancarias.length > 0 ? (
                          cuentasBancarias.find(
                            (cuenta) =>
                              cuenta.id.toString() ===
                              pago.cuentaBancariaId.toString(),
                          )?.codigo || pago.cuentaBancariaId
                        ) : "—"}
                      </td>

                      <td className={styles.amount}>${pago.montoTotal}</td>

                      <td>{new Date(pago.fecha).toLocaleDateString()}</td>

                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isActivo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {pago.estado?.toUpperCase() || "INACTIVO"}
                        </span>
                      </td>

                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPagoEditar(pago)}
                            disabled={disableEdit}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              disableEdit
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-[0.98]"
                            }`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              descargarPDFPago(pago.id);
                              // Actualizar estado local para reflejar que cambió a activo
                              setPagos((prev) =>
                                prev.map((p) =>
                                  p.id === pago.id ? { ...p, estado: "activo" } : p
                                )
                              );
                            }}
                            disabled={disablePdf}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              disablePdf
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-[0.98]"
                            }`}
                            title="Descargar Comprobante PDF"
                          >
                            ↓ PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    No existen pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Registro de Pagos</h2>

              <button
                className={styles.closeButton}
                onClick={() => setMostrarModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalContent}>
              <FormularioPago
                onGuardado={() => {
                  setMostrarModal(false);
                  cargarPagos();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {pagoEditar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Editar Pago</h2>
              <button
                className={styles.closeButton}
                onClick={() => setPagoEditar(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const payload = {
                    descripcion: target.descripcion.value,
                    cuentaBancariaId: target.cuentaBancariaId.value,
                    fecha: target.fecha.value,
                  };
                  try {
                    const response = await fetch(`${API_URL}/pagos/${pagoEditar.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (response.ok) {
                      alert("Pago editado con éxito.");
                      setPagoEditar(null);
                      cargarPagos();
                    } else {
                      const err = await response.json();
                      alert(`Error al editar el pago: ${err.message || response.statusText}`);
                    }
                  } catch (error) {
                    console.error(error);
                    alert("Error de red al editar el pago.");
                  }
                }}
                className="flex flex-col gap-4 p-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-600">Fecha de Pago</label>
                  <input
                    type="date"
                    name="fecha"
                    defaultValue={pagoEditar.fecha ? pagoEditar.fecha.split("T")[0] : ""}
                    className="p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-600">Cuenta Bancaria Destino</label>
                  <select
                    name="cuentaBancariaId"
                    defaultValue={pagoEditar.cuentaBancariaId}
                    className="p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm"
                    required
                  >
                    <option value="">Seleccione una cuenta</option>
                    {cuentasBancarias.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.entidadBancaria} - {cuenta.nombreCuenta}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-600">Descripción / Concepto</label>
                  <textarea
                    name="descripcion"
                    defaultValue={pagoEditar.descripcion}
                    rows={3}
                    className="p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setPagoEditar(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl"
                  >
                    Guardar Cambios
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
