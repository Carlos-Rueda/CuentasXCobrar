"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function CuentasBancariasPage() {
  const [formData, setFormData] = useState({
    codigo: "",
    nombreCuenta: "",
    entidadBancaria: "",
    descripcion: "",
    estado: true,
  });
  const [mostrarModal, setMostrarModal] = useState(false);
  // Almacena el Id del registro que se esta editando
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [cuentas, setCuentas] = useState([
    {
      id: 1,
      codigo: "CTA-BAN-001",
      nombreCuenta: "Cuenta de Ahorros",
      entidadBancaria: "Banco Pichincha",
      estado: "ACTIVO",
    },
    {
      id: 2,
      codigo: "CTA-BAN-002",
      nombreCuenta: "Cuenta Corriente",
      entidadBancaria: "Banco Guayaquil",
      estado: "ACTIVO",
    },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const guardarCuenta = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/cuentas-bancarias",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      console.log(data);
      if (editandoId) {
        setCuentas(
          cuentas.map((cuenta) =>
            cuenta.id === editandoId
              ? {
                  ...cuenta,
                  codigo: formData.codigo,
                  nombreCuenta: formData.nombreCuenta,
                  entidadBancaria: formData.entidadBancaria,
                }
              : cuenta,
          ),
        );

        setEditandoId(null);
      } else {
        setCuentas([
          ...cuentas,
          {
            id: Date.now(),
            codigo: formData.codigo,
            nombreCuenta: formData.nombreCuenta,
            entidadBancaria: formData.entidadBancaria,
            estado: "ACTIVO",
          },
        ]);
      }
      setFormData({
        codigo: "",
        nombreCuenta: "",
        entidadBancaria: "",
        descripcion: "",
        estado: true,
      });

      setMostrarModal(false);
      alert("Cuenta bancaria guardada");
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };
  const editarCuenta = (cuenta: any) => {
    setFormData({
      codigo: cuenta.codigo,
      nombreCuenta: cuenta.nombreCuenta,
      entidadBancaria: cuenta.entidadBancaria,
      descripcion: cuenta.descripcion || "",
      estado: true,
    });

    setEditandoId(cuenta.id);

    setMostrarModal(true);
  };
  const inactivarCuenta = (id: number) => {
    setCuentas(
      cuentas.map((cuenta) =>
        cuenta.id === id
          ? {
              ...cuenta,
              estado: "INACTIVO",
            }
          : cuenta,
      ),
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Administración de Cuentas Bancarias</h1>

          <button
            className={styles.createButton}
            onClick={() => setMostrarModal(true)}
          >
            + Crear
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre Cuenta</th>
                <th>Entidad Bancaria</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cuentas.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td>{cuenta.codigo}</td>
                  <td>{cuenta.nombreCuenta}</td>
                  <td>{cuenta.entidadBancaria}</td>
                  <td>{cuenta.estado}</td>

                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => editarCuenta(cuenta)}
                    >
                      Editar
                    </button>

                    <button
                      className={styles.deleteButton}
                      onClick={() => inactivarCuenta(cuenta.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mostrarModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <div className={styles.modalHeader}>
                  <h2>
                    {editandoId
                      ? "Editar Cuenta Bancaria"
                      : "Nueva Cuenta Bancaria"}
                  </h2>

                  <button
                    className={styles.closeButton}
                    onClick={() => setMostrarModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.form}>
                  <div className={styles.group}>
                    <label>Código</label>
                    <input
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.group}>
                    <label>Nombre Cuenta</label>
                    <input
                      name="nombreCuenta"
                      value={formData.nombreCuenta}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.group}>
                    <label>Entidad Bancaria</label>
                    <input
                      name="entidadBancaria"
                      value={formData.entidadBancaria}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.group}>
                    <label>Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                    />
                  </div>

                  <button className={styles.button} onClick={guardarCuenta}>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
