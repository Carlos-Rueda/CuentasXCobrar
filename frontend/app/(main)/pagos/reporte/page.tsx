"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import FormularioPago from "../components/FormularioPago";
import { API_URL } from "@/app/config";

export default function ReportePagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState("");

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
    if (!filtroCliente) return true;
    return pago.clienteId === filtroCliente;
  });

  const totalPagos = pagosFiltrados.length;

  const montoTotal = pagosFiltrados.reduce(
    (total, pago) => total + Number(pago.montoTotal),
    0,
  );
interface CuentaBancaria {
  id: string;
  codigo: string;
  nombreCuenta: string;
  entidadBancaria: string;
  descripcion?: string;
  estado: string;
  clienteId?: string;
}

  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);

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
  const [clientes, setClientes] = useState<any[]>([]);

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

        <div className={styles.actions} style={{ display: "flex", gap: "15px", alignItems: "center" }}>
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
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pagosFiltrados.length > 0 ? (
                pagosFiltrados.map((pago) => (
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
                      <button
                        onClick={() => descargarPDFPago(pago.id)}
                        className={styles.pdfButton}
                        title="Descargar Comprobante PDF"
                      >
                        ↓ PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.empty}>
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
    </div>
  );
}
