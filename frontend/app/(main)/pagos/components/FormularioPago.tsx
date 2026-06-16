"use client";

import { useEffect, useState } from "react";
import styles from "../page.module.css";

type FormularioPagoProps = {
  onGuardado?: () => void;
};

export default function PagosPage({ onGuardado }: FormularioPagoProps) {
  const [formData, setFormData] = useState({
    numeroPago: "PAG-CLI-00001",
    fecha: "",
    clienteId: "",
    cuentaBancariaId: "",
    descripcion: "",

    facturaId: "",
    montoAbonado: 0,
  });
  const [pagos, setPagos] = useState<any[]>([]);

  const [facturas, setFacturas] = useState<any[]>([]);

  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<any[]>([]);
  const montoTotalCalculado = facturasSeleccionadas.reduce(
    (total, factura) => total + Number(factura.montoAbonado),
    0,
  );

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

  const cuentasBancarias = [
    {
      id: 1,
      codigo: "CTA-BAN-002",
      nombreCuenta: "Cuenta de Ahorros",
    },
    {
      id: 2,
      codigo: "CTA-BAN-002",
      nombreCuenta: "Cuenta Corriente",
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const seleccionarFactura = (factura: any, checked: boolean) => {
    if (checked) {
      setFacturasSeleccionadas([
        ...facturasSeleccionadas,
        {
          facturaId: factura.id,
          montoAbonado: 0,
        },
      ]);
    } else {
      setFacturasSeleccionadas(
        facturasSeleccionadas.filter((f) => f.facturaId !== factura.id),
      );
    }
  };
  console.log(facturasSeleccionadas);

  const guardarPago = async () => {
    try {
      const payload = {
        clienteId: formData.clienteId,
        cuentaBancariaId: formData.cuentaBancariaId,
        montoTotal: montoTotalCalculado,

        detalles: facturasSeleccionadas,
      };
      console.log("PAYLOAD", payload);
      const response = await fetch("http://localhost:3000/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log(data);
      console.log(data);

      alert("Pago registrado correctamente");

      if (onGuardado) {
        onGuardado();
      }
    } catch (error) {
      console.error(error);
      alert("Error al registrar el pago");
    }
  };
  const cargarPagos = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/pagos/reporte");

      const data = await response.json();

      setPagos(data);
    } catch (error) {
      console.error(error);
    }
  };
  const cargarFacturas = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/pagos/facturas");

      const data = await response.json();

      setFacturas(data);
    } catch (error) {
      console.error(error);
    }
  };
  const actualizarMonto = (facturaId: string, monto: number) => {
    const facturaOriginal = facturas.find((f) => f.id === facturaId);

    if (!facturaOriginal) return;

    if (monto > facturaOriginal.pendiente) {
      alert(
        `El monto no puede superar el saldo pendiente de $${facturaOriginal.pendiente}`,
      );
      return;
    }

    setFacturasSeleccionadas(
      facturasSeleccionadas.map((factura) =>
        factura.facturaId === facturaId
          ? {
              ...factura,
              montoAbonado: monto,
            }
          : factura,
      ),
    );
  };
  const facturaSeleccionada = (facturaId: string) => {
    return facturasSeleccionadas.some((f) => f.facturaId === facturaId);
  };

  useEffect(() => {
    cargarPagos();
    cargarFacturas();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Registro de Cobros</h1>
          <p>Cabecera del pago del cliente</p>
        </div>

        <div className={styles.form}>
          <div className={styles.group}>
            <label>Número de Pago</label>
            <input
              type="text"
              name="numeroPago"
              value={formData.numeroPago}
              readOnly
            />
          </div>

          <div className={styles.group}>
            <label>Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label>Cliente</label>

            <select
              name="clienteId"
              value={formData.clienteId}
              onChange={handleChange}
            >
              <option value="">Seleccione un cliente</option>

              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.group}>
            <label>Cuenta Bancaria</label>

            <select
              name="cuentaBancariaId"
              value={formData.cuentaBancariaId}
              onChange={handleChange}
            >
              <option value="">Seleccione una cuenta bancaria</option>

              {cuentasBancarias.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.codigo} - {cuenta.nombreCuenta}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.group}>
            <label>Facturas Disponibles</label>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Factura</th>
                  <th>Pendiente</th>
                  <th>Monto Abonado</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((factura) => (
                  <tr key={factura.id}>
                    <td>
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          seleccionarFactura(factura, e.target.checked)
                        }
                      />
                    </td>

                    <td>{factura.id}</td>

                    <td>${factura.pendiente}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        disabled={!facturaSeleccionada(factura.id)}
                        onChange={(e) =>
                          actualizarMonto(factura.id, Number(e.target.value))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.group}>
            <label>Monto Total</label>

            <input type="number" value={montoTotalCalculado} readOnly />
          </div>

          <div className={styles.group}>
            <label>Descripción</label>

            <textarea
              name="descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={handleChange}
            />
          </div>

          <button className={styles.button} onClick={guardarPago}>
            Guardar Pago
          </button>
        </div>
      </div>
    </div>
  );
}
