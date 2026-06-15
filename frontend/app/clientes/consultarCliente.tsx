"use client";

import { useState } from "react";
import styles from "./consultarCliente.module.css";

export default function ClientesPage() {
  const [clienteId, setClienteId] = useState("");
  const [estadoCuenta, setEstadoCuenta] = useState<any[]>([]);

  const clientes = [
    {
      id: "C1",
      nombre: "Carlos Rueda",
    },
    {
      id: "C2",
      nombre: "Distribuidora Norte",
    },
  ];

  const consultarEstadoCuenta = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/pagos/estado-cuenta/${clienteId}`
      );

      const data = await response.json();

      setEstadoCuenta(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Estado de Cuenta del Cliente</h1>
          <p>Consulta de facturas pendientes</p>
        </div>

        <div className={styles.content}>
          <div className={styles.group}>
            <label>Cliente</label>

            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">
                Seleccione un cliente
              </option>

              {clientes.map((cliente) => (
                <option
                  key={cliente.id}
                  value={cliente.id}
                >
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            className={styles.button}
            onClick={consultarEstadoCuenta}
          >
            Consultar Estado de Cuenta
          </button>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Factura</th>
                <th>Total</th>
                <th>Pendiente</th>
              </tr>
            </thead>

            <tbody>
              {estadoCuenta.map((factura) => (
                <tr key={factura.id}>
                  <td>{factura.id}</td>
                  <td>${factura.total}</td>
                  <td>${factura.pendiente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}