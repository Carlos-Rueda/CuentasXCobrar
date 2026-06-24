"use client";

import Link from "next/link";
import FormularioPago from "./components/FormularioPago";
import styles from "./page.module.css";

export default function PagosPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Registro de Pagos</h1>
            <p>Cabecera del pago del cliente</p>
          </div>
          <Link href="/pagos/reporte" className={styles.button} style={{ textDecoration: "none" }}>
            Ver Historial de Pagos
          </Link>
        </div>
        <div className={styles.form}>
          <FormularioPago />
        </div>
      </div>
    </div>
  );
}