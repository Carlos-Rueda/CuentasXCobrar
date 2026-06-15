"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function ReportePagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);

  const cargarPagos = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/pagos/reporte"
      );

      const data = await response.json();

      setPagos(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Listado de Pagos</h1>
          <p>Reporte de cobros registrados</p>
        </div>

        <div className={styles.content}>
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

                    <td className={styles.amount}>
                      ${pago.montoTotal}
                    </td>

                    <td className={styles.date}>
                      {new Date(
                        pago.fecha
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className={styles.empty}
                  >
                    No existen pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}