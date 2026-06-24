"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { API_URL } from "@/app/config";

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

  const [clientes, setClientes] = useState<any[]>([]);

  const cargarClientes = async () => {
    try {
      const response = await fetch(`${API_URL}/facturas/clientes`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setClientes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setClientes([]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "clienteId") {
      setFormData({
        ...formData,
        clienteId: value,
        cuentaBancariaId: "",
      });
      setFacturasSeleccionadas([]);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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
        descripcion: formData.descripcion,
        detalles: facturasSeleccionadas,
      };
      console.log("PAYLOAD", payload);
      const response = await fetch(`${API_URL}/pagos`, {
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
      const response = await fetch(`${API_URL}/pagos/reporte`, {
        cache: "no-store",
      });

      const data = await response.json();

      setPagos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setPagos([]);
    }
  };
  const cargarFacturas = async () => {
    try {
      const response = await fetch(`${API_URL}/pagos/facturas`, {
        cache: "no-store",
      });

      const data = await response.json();

      setFacturas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFacturas([]);
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
    cargarClientes();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Registro de Pagos</h1>
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

          {/* Cuenta Bancaria se maneja de forma interna y no es requerida en este formulario */}
          <div className={styles.group}>
            <label>Facturas Disponibles</label>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Factura</th>
                  <th>Total</th>
                  <th>Abonado</th>
                  <th>Pendiente</th>
                  <th>Monto a Cobrar</th>
                </tr>
              </thead>
              <tbody>
                {facturas
                  .filter((factura) => factura.clienteId === formData.clienteId)
                  .map((factura) => {
                    const abonado = Number(factura.total) - Number(factura.pendiente);
                    return (
                      <tr key={factura.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={facturaSeleccionada(factura.id)}
                            onChange={(e) =>
                              seleccionarFactura(factura, e.target.checked)
                            }
                          />
                        </td>

                        <td>{factura.id}</td>
                        <td>${factura.total}</td>
                        <td>${abonado}</td>
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
                    );
                  })}
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
