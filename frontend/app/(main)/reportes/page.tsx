"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef, useMemo } from "react";
import { API_URL } from "@/app/config";
import DataTable, { ColumnDef } from "@/app/components/DataTable";
import DatePicker from "@/app/components/DatePicker";
import { useToast } from "@/app/components/toast";

type Registro = {
  id: string;
  cliente: string;
  cedula: string;
  factura: string;
  fecha: string;
  estado: "Pagado" | "Parcial" | "Por Pagar";
  monto: number;
  pagado: number;
  ultimoPago: string | null;
};

function imprimirRecibo(r: Registro) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${r.factura}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:48px;max-width:520px;margin:auto}
    h1{font-size:20px;font-weight:600;margin-bottom:8px}
    .sub{color:#666;font-size:13px;margin-bottom:32px}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 0;font-size:14px;border-bottom:1px solid #eee}
    td:first-child{color:#666;width:40%}
    td:last-child{font-weight:500}
    .footer{margin-top:40px;font-size:12px;color:#999;text-align:center}
  </style></head><body>
  <h1>Recibo de pago</h1>
  <div class="sub">Sistema de Cuentas por Cobrar</div>
  <table>
    <tr><td>Cliente</td><td>${r.cliente}</td></tr>
    <tr><td>Cédula</td><td>${r.cedula}</td></tr>
    <tr><td>Factura</td><td>${r.factura}</td></tr>
    <tr><td>Fecha</td><td>${r.fecha}</td></tr>
    <tr><td>Estado</td><td>${r.estado}</td></tr>
    <tr><td>Monto total</td><td>$${r.monto.toLocaleString()}</td></tr>
    <tr><td>Pagado</td><td style="color:#16a34a">$${r.pagado.toLocaleString()}</td></tr>
    <tr><td>Saldo pendiente</td><td style="color:${r.monto - r.pagado > 0 ? "#dc2626" : "#16a34a"}">$${(r.monto - r.pagado).toLocaleString()}</td></tr>
    <tr><td>Último pago</td><td>${r.ultimoPago ?? "Sin pagos"}</td></tr>
  </table>
  <div class="footer">Generado el ${new Date().toLocaleDateString("es-EC")}</div>
  </body></html>`;
  const w = window.open("", "_blank", "width=600,height=700");
  if (!w) {
    alert("El navegador bloqueó la ventana emergente.");
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 800);
}

export default function ReportesPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const { showToast } = useToast();
  const [filtradosActuales, setFiltradosActuales] = useState<Registro[]>([]);
  const [descargando, setDescargando] = useState(false);

  // ── Filtro por fechas ──────────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [dateError, setDateError] = useState("");

  const registrosPorFecha = useMemo(() => {
    if (!fechaInicio && !fechaFin) return registros;
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      setDateError(
        "La fecha de inicio no puede ser posterior a la fecha de fin.",
      );
      return registros;
    }
    setDateError("");
    return registros.filter((r) => {
      if (!r.fecha) return true;
      const f = r.fecha.slice(0, 10); // YYYY-MM-DD
      if (fechaInicio && f < fechaInicio) return false;
      if (fechaFin && f > fechaFin) return false;
      return true;
    });
  }, [registros, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    // Cada fetch falla de forma independiente para que un endpoint caído
    // no bloquee los datos que sí están disponibles
    const fetchSafe = async (url: string): Promise<any[]> => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    const [rawClients, listFacturas, listPagos] = await Promise.all([
      fetchSafe(`${API_URL}/facturas/clientes`),
      fetchSafe(`${API_URL}/facturas`),
      fetchSafe(`${API_URL}/pagos/reporte`),
    ]);

    const uniqueMap = new Map(
      rawClients.map((c: any) => [c.cedula || c.ruc || c.nombre, c]),
    );
    const clientesLimpios = Array.from(uniqueMap.values()).filter(
      (c: any) =>
        c.nombre && c.nombre.trim() !== "" && c.nombre.trim() !== "undefined",
    );

    const mappedRegistros: Registro[] = listFacturas.map((f: any) => {
      const client = clientesLimpios.find(
        (c: any) => c.id === f.clienteId,
      ) as any;

      let pagado = 0;
      let ultimoPago: string | null = null;

      listPagos.forEach((pago: any) => {
        const detail = pago.detalles?.find((d: any) => d.facturaId === f.id);
        if (detail) {
          pagado += Number(detail.montoAbonado) || 0;
          ultimoPago = pago.fecha;
        }
      });

      if (f.estado === "PAGADA" && pagado === 0) {
        pagado = f.total;
      }

      let estado: "Pagado" | "Parcial" | "Por Pagar" = "Por Pagar";
      if (pagado >= f.total) {
        estado = "Pagado";
      } else if (pagado > 0) {
        estado = "Parcial";
      }

      return {
        id: f.id,
        cliente: client ? client.nombre : f.clienteId,
        cedula: client ? client.ruc : "—",
        factura: f.numero,
        fecha: f.fechaEmision,
        estado,
        monto: f.total,
        pagado,
        ultimoPago: ultimoPago
          ? new Date(ultimoPago).toLocaleDateString("es-EC")
          : null,
      };
    });

    setRegistros(mappedRegistros);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  async function descargarPDF(r: Registro) {
    try {
      const res = await fetch(`${API_URL}/facturas/${r.id}/pdf`);
      if (!res.ok) {
        showToast(
          `No se encontró el comprobante para la factura ${r.factura}.`,
          "error",
        );
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Factura-${r.factura}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      showToast("No fue posible descargar el comprobante PDF.", "error");
    }
  }

  const totalMonto = filtradosActuales.reduce((s, r) => s + r.monto, 0);
  const totalCobrado = filtradosActuales.reduce((s, r) => s + r.pagado, 0);
  const totalDeuda = totalMonto - totalCobrado;

  // ── Generar PDF empresarial ────────────────────────────────────────────────
  const generarPDF = async () => {
    if (filtradosActuales.length === 0) return;
    setDescargando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const fecha = new Date().toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // ── Encabezado ────────────────────────────────────────────────────────
      doc.setFillColor(190, 0, 34); // UTN rojo
      doc.rect(0, 0, 297, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("UNIVERSIDAD TÉCNICA DEL NORTE", 14, 10);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Sistema de Cuentas por Cobrar — Reporte Empresarial", 14, 17);
      doc.setFontSize(9);
      doc.text(`Generado el ${fecha}`, 240, 10);
      doc.text(`Total registros: ${filtradosActuales.length}`, 240, 17);

      // ── Métricas ──────────────────────────────────────────────────────────
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const y = 30;
      const metrics = [
        {
          label: "Total facturado",
          value: `$${totalMonto.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`,
        },
        {
          label: "Total cobrado",
          value: `$${totalCobrado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`,
        },
        {
          label: "Por cobrar",
          value: `$${totalDeuda.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`,
        },
      ];
      metrics.forEach((m, i) => {
        const x = 14 + i * 90;
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(x, y, 80, 14, 2, 2, "F");
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text(m.label.toUpperCase(), x + 4, y + 5);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(55, 65, 81);
        doc.text(m.value, x + 4, y + 12);
        doc.setFont("helvetica", "normal");
      });

      // ── Tabla ─────────────────────────────────────────────────────────────
      autoTable(doc, {
        startY: 50,
        head: [
          [
            "N° Factura",
            "Cliente",
            "Cédula / RUC",
            "Fecha Emisión",
            "Monto ($)",
            "Cobrado ($)",
            "Último Pago",
          ],
        ],
        body: filtradosActuales.map((r) => [
          r.factura || "—",
          r.cliente,
          r.cedula,
          r.fecha || "—",
          r.monto.toLocaleString("es-EC", { minimumFractionDigits: 2 }),
          r.pagado.toLocaleString("es-EC", { minimumFractionDigits: 2 }),
          r.ultimoPago || "Sin pagos",
        ]),
        foot: [
          [
            "",
            "",
            "",
            "TOTALES",
            `$${totalMonto.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`,
            `$${totalCobrado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`,
            "",
          ],
        ],
        headStyles: {
          fillColor: [190, 0, 34],
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [55, 65, 81],
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 7.5, textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 30 },
          4: { halign: "right" },
          5: { halign: "right" },
        },
        styles: { overflow: "linebreak", cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      // ── Pie de página ─────────────────────────────────────────────────────
      const pages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Página ${i} de ${pages} — Documento confidencial, uso interno`,
          14,
          205,
        );
        doc.text("UTN — Sistema CXC", 270, 205);
      }

      doc.save(`Reporte-CXC-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      showToast("No existen datos para generar el reporte PDF.", "error");
    } finally {
      setDescargando(false);
    }
  };

  const columns: ColumnDef<Registro>[] = [
    {
      key: "cliente",
      label: "Cliente",
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.cliente}</p>
          <p className="font-mono text-xs text-gray-500 mt-0.5">{r.cedula}</p>
        </div>
      ),
    },
    { key: "factura", label: "N° Factura", sortable: true },
    {
      key: "fecha",
      label: "Fecha Emisión",
      sortable: true,
      render: (r) => <span className="text-xs text-gray-600">{r.fecha}</span>,
    },
    {
      key: "monto",
      label: "Total ($)",
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-gray-900">
          ${r.monto.toLocaleString()}
        </span>
      ),
    },
    {
      key: "pagado",
      label: "Cobrado ($)",
      sortable: true,
      render: (r) => (
        <span className="text-emerald-700 font-medium">
          ${r.pagado.toLocaleString()}
        </span>
      ),
    },
    {
      key: "ultimoPago",
      label: "Último Pago",
      sortable: false,
      render: (r) =>
        r.ultimoPago ? (
          <span className="text-xs font-medium text-gray-700">
            {r.ultimoPago}
          </span>
        ) : (
          <span className="text-xs text-gray-400">Sin pagos</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="text-xs text-gray-500 mb-1">
            <span>Inicio</span>
            <span className="mx-1">/</span>
            <span className="text-gray-700 font-medium">Reportes</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            Reporte Empresarial
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Consolidado de cuentas por cobrar. Usa el buscador para filtrar y
            luego descarga el informe.
          </p>
        </div>

        <button
          type="button"
          onClick={generarPDF}
          disabled={descargando || filtradosActuales.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          style={{ background: descargando ? "#9A001B" : "var(--utn-red)" }}
        >
          {descargando ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generando PDF...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Descargar Informe PDF
              {filtradosActuales.length > 0 && (
                <span className="bg-white/25 text-xs px-1.5 py-0.5 rounded-full">
                  {filtradosActuales.length}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ── Filtro de fechas ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Rango de fechas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <DatePicker
            label="Fecha de Inicio"
            value={fechaInicio}
            onChange={(v) => {
              setFechaInicio(v);
              setDateError("");
            }}
          />
          <DatePicker
            label="Fecha de Fin"
            value={fechaFin}
            onChange={(v) => {
              setFechaFin(v);
              setDateError("");
            }}
          />
          <button
            type="button"
            onClick={() => {
              setFechaInicio("");
              setFechaFin("");
              setDateError("");
            }}
            disabled={!fechaInicio && !fechaFin}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Limpiar fechas
          </button>
        </div>
        {dateError && (
          <p className="mt-3 text-xs font-medium text-red-600 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {dateError}
          </p>
        )}
        {(fechaInicio || fechaFin) && !dateError && (
          <p className="mt-3 text-xs text-gray-500">
            Mostrando{" "}
            <strong className="text-gray-700">
              {registrosPorFecha.length}
            </strong>{" "}
            de {registros.length} registros
            {fechaInicio && (
              <>
                {" "}
                desde <strong className="text-gray-700">{fechaInicio}</strong>
              </>
            )}
            {fechaFin && (
              <>
                {" "}
                hasta <strong className="text-gray-700">{fechaFin}</strong>
              </>
            )}
          </p>
        )}
      </div>

      {/* ── Métricas (reflejan la búsqueda actual) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Registros",
            value: filtradosActuales.length,
            color: "text-gray-900",
          },
          {
            label: "Total",
            value: `$${totalMonto.toLocaleString()}`,
            color: "text-gray-900",
          },
          {
            label: "Cobrado",
            value: `$${totalCobrado.toLocaleString()}`,
            color: "text-emerald-600",
          },
          {
            label: "Por cobrar",
            value: `$${totalDeuda.toLocaleString()}`,
            color: "text-red-700",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={registrosPorFecha}
        rowKey={(r) => r.id}
        searchKeys={["cliente", "cedula", "factura"]}
        pageOptions={[10, 25, 50, 100]}
        onFilteredChange={setFiltradosActuales}
        emptyMessage="Sin resultados para el rango de fechas y búsqueda seleccionados."
      />
    </div>
  );
}
