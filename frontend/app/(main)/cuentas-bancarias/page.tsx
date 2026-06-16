"use client";

import { useState, useEffect } from "react";
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
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cuentas, setCuentas] = useState<any[]>([]);

  const cargarCuentas = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/cuentas-bancarias");
      if (response.ok) {
        const data = await response.json();
        setCuentas(data);
      }
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

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
    if (!formData.codigo || !formData.nombreCuenta || !formData.entidadBancaria) {
      alert("Por favor rellene los campos obligatorios");
      return;
    }

    const payload = {
      codigo: formData.codigo,
      nombreCuenta: formData.nombreCuenta,
      entidadBancaria: formData.entidadBancaria,
      descripcion: formData.descripcion,
      estado: formData.estado ? "ACTIVO" : "INACTIVO",
    };

    try {
      let response;
      if (editandoId) {
        response = await fetch(
          `http://localhost:3000/api/cuentas-bancarias/${editandoId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        response = await fetch(
          "http://localhost:3000/api/cuentas-bancarias",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: `CB-${Date.now()}`,
              ...payload
            }),
          },
        );
      }

      if (response.ok) {
        await cargarCuentas();
        setFormData({
          codigo: "",
          nombreCuenta: "",
          entidadBancaria: "",
          descripcion: "",
          estado: true,
        });
        setEditandoId(null);
        setMostrarModal(false);
        alert(editandoId ? "Cuenta bancaria actualizada correctamente" : "Cuenta bancaria guardada correctamente");
      } else {
        alert("Error al guardar la cuenta bancaria");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  const editarCuenta = (cuenta: any) => {
    setFormData({
      codigo: cuenta.codigo,
      nombreCuenta: cuenta.nombreCuenta,
      entidadBancaria: cuenta.entidadBancaria,
      descripcion: cuenta.descripcion || "",
      estado: cuenta.estado === "ACTIVO",
    });
    setEditandoId(cuenta.id);
    setMostrarModal(true);
  };

  const inactivarCuenta = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta cuenta bancaria?")) return;
    try {
      const response = await fetch(`http://localhost:3000/api/cuentas-bancarias/${id}`, {
        method: "DELETE"
      });
      if (response.ok || response.status === 204) {
        await cargarCuentas();
        alert("Cuenta bancaria eliminada correctamente");
      } else {
        alert("Error al eliminar la cuenta bancaria");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Administración de Cuentas Bancarias</h1>
          <button
            className={styles.createButton}
            onClick={() => {
              setEditandoId(null);
              setFormData({
                codigo: "",
                nombreCuenta: "",
                entidadBancaria: "",
                descripcion: "",
                estado: true,
              });
              setMostrarModal(true);
            }}
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
              {cuentas.length > 0 ? (
                cuentas.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td>{cuenta.codigo}</td>
                    <td>{cuenta.nombreCuenta}</td>
                    <td>{cuenta.entidadBancaria}</td>
                    <td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        background: cuenta.estado === "ACTIVO" ? "#dcfce7" : "#fee2e2",
                        color: cuenta.estado === "ACTIVO" ? "#15803d" : "#b91c1c"
                      }}>
                        {cuenta.estado}
                      </span>
                    </td>

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
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                    No hay cuentas bancarias registradas.
                  </td>
                </tr>
              )}
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
                    <label>Código *</label>
                    <input
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleChange}
                      placeholder="e.g. CTA-BAN-001"
                    />
                  </div>

                  <div className={styles.group}>
                    <label>Nombre Cuenta *</label>
                    <input
                      name="nombreCuenta"
                      value={formData.nombreCuenta}
                      onChange={handleChange}
                      placeholder="e.g. Cuenta Corriente"
                    />
                  </div>

                  <div className={styles.group}>
                    <label>Entidad Bancaria *</label>
                    <input
                      name="entidadBancaria"
                      value={formData.entidadBancaria}
                      onChange={handleChange}
                      placeholder="e.g. Banco Pichincha"
                    />
                  </div>

                  <div className={styles.group}>
                    <label>Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Descripción opcional de la cuenta..."
                      rows={3}
                    />
                  </div>

                  <div className={styles.group} style={{ flexDirection: "row", alignItems: "center", gap: "10px", margin: "10px 0 20px" }}>
                    <input
                      type="checkbox"
                      name="estado"
                      id="estado_chk"
                      checked={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                      style={{ width: "auto", cursor: "pointer" }}
                    />
                    <label htmlFor="estado_chk" style={{ margin: 0, cursor: "pointer" }}>Cuenta Activa</label>
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
