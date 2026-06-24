"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import styles from "./consultarCliente.module.css";
import { API_URL } from "@/app/config";

export default function ClientesPage() {
  const [clienteId, setClienteId] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);
  const [estadoCuenta, setEstadoCuenta] = useState<any>(null);

  useEffect(() => {
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
      }
    };
    cargarClientes();
  }, []);

  const consultarEstadoCuenta = async () => {
    if (!clienteId) {
      alert("Seleccione un cliente.");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/cxc/estado-cuenta/${clienteId}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        alert("No se encontró el estado de cuenta.");
        return;
      }
      const data = await response.json();
      setEstadoCuenta(data);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Estado de Cuenta del Cliente</h1>
          <p>Consulta de facturas pendientes y abonos</p>
          {estadoCuenta && (
            <div className={styles.clientDetails}>
              <p><strong>Cliente:</strong> {estadoCuenta.nombreCliente}</p>
              <p><strong>RUC:</strong> {estadoCuenta.ruc}</p>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.group}>
            <label>Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} - {cliente.cedula || cliente.ruc}
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

          {estadoCuenta && (
            <>
              <div className={styles.metrics}>
                <div className={styles.metricCard}>
                  <span>Total Facturado</span>
                  <strong>${estadoCuenta.totalFacturado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Total Pagado</span>
                  <strong style={{ color: "#16a34a" }}>${estadoCuenta.totalPagado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Saldo Pendiente</span>
                  <strong style={{ color: estadoCuenta.saldoPendiente > 0 ? "#dc2626" : "#16a34a" }}>
                    ${estadoCuenta.saldoPendiente.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#334155", marginBottom: "15px" }}>Historial de Movimientos</h2>
              
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Documento</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {estadoCuenta.historial && estadoCuenta.historial.length > 0 ? (
                    estadoCuenta.historial.map((mov: any, index: number) => (
                      <tr key={index}>
                        <td>{new Date(mov.fecha).toLocaleDateString()}</td>
                        <td>{mov.documento}</td>
                        <td>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: mov.tipo === "DEBITO" ? "#fee2e2" : "#dcfce7",
                            color: mov.tipo === "DEBITO" ? "#b91c1c" : "#15803d"
                          }}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td style={{ fontWeight: "600", color: mov.tipo === "DEBITO" ? "#b91c1c" : "#15803d" }}>
                          {mov.tipo === "DEBITO" ? "-" : "+"}${mov.monto.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>Sin movimientos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}