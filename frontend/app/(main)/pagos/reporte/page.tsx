"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import FormularioPago from "../components/FormularioPago";
import { API_URL } from "@/app/config";

export default function ReportePagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarPagos = async () => {
    try {
      const response = await fetch(`${API_URL}/pagos/reporte`);

      const data = await response.json();

      setPagos(data);
    } catch (error) {
      console.error(error);
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
  const totalPagos = pagos.length;

  const montoTotal = pagos.reduce(
    (total, pago) => total + Number(pago.montoTotal),
    0,
  );
  const cuentasBancarias = [
    {
      id: 1,
      codigo: "CTA-BAN-001",
      nombreCuenta: "Cuenta de Ahorros",
    },
    {
      id: 2,
      codigo: "CTA-BAN-002",
      nombreCuenta: "Cuenta Corriente",
    },
  ];
  const clientes = [
    {
      id: "cli-001",
      nombre: "Carlos Rueda",
    },
    {
      id: "cli-002",
      nombre: "Distribuidora Norte",
    },
    {
      id: "cli-003",
      nombre: "María Andrade",
    },
  ];

  useEffect(() => {
    cargarPagos();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.titleSection}>
          <h1>Cobros</h1>
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

        <div className={styles.actions}>
          <button
            className={styles.newButton}
            onClick={() => setMostrarModal(true)}
          >
            + Nuevo Cobro
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Cuenta Bancaria</th>
                <th>Monto Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pagos.length > 0 ? (
                pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.id}</td>

                    <td>
                      {clientes.find((cliente) => cliente.id === pago.clienteId)
                        ?.nombre || pago.clienteId}
                    </td>

                    <td>
                      {cuentasBancarias.find(
                        (cuenta) =>
                          cuenta.id.toString() ===
                          pago.cuentaBancariaId.toString(),
                      )?.codigo || pago.cuentaBancariaId}
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
              <h2>Registro de Cobros</h2>

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
