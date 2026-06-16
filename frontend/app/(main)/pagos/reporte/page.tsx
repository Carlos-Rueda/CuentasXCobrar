"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import FormularioPago from "../components/FormularioPago";

export default function ReportePagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarPagos = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/pagos/reporte");

      const data = await response.json();

      setPagos(data);
    } catch (error) {
      console.error(error);
    }
  };
  const totalPagos = pagos.length;

  const montoTotal = pagos.reduce(
    (total, pago) => total + Number(pago.montoTotal),
    0,
  );

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
              </tr>
            </thead>

            <tbody>
              {pagos.length > 0 ? (
                pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.id}</td>

                    <td>{pago.clienteId}</td>

                    <td>{pago.cuentaBancariaId}</td>

                    <td className={styles.amount}>${pago.montoTotal}</td>

                    <td>{new Date(pago.fecha).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.empty}>
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
