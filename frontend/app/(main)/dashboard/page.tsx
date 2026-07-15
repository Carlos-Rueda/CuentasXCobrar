"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/config";
import KpiCard from "./components/KpiCard";
import styles from "./Dashboard.module.css";
import CashFlowChart from "./components/CashFlowChart";
import CobradoPendienteChart from "./components/CobradoPendienteChart";
import TopClientesDeudaChart from "./components/TopClientesDeudaChart";
import TopClientesPagosChart from "./components/TopClientesPagosChart";
import CuentaBancariaDonut from "./components/CuentaBancariaDonut";

export default function DashboardPage() {
  const [montoConfirmado, setMontoConfirmado] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [clientesConDeuda, setClientesConDeuda] = useState(0);
  const [pendiente, setPendiente] = useState(0);
  const [graficoLinea, setGraficoLinea] = useState<any[]>([]);
  const [graficoBarras, setGraficoBarras] = useState<any[]>([]);
  const [topClientesDeuda, setTopClientesDeuda] = useState<any[]>([]);
  const [anios, setAnios] = useState<number[]>([]);
  const [topClientesPagos, setTopClientesPagos] = useState<any[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState("Todos");
  const [mesSeleccionado, setMesSeleccionado] = useState("Todos");
  const [graficoCuentas, setGraficoCuentas] = useState<any[]>([]);

  useEffect(() => {
    cargarDashboard();
  }, [anioSeleccionado, mesSeleccionado]);
  const mesesFiltro = [
    "Todos",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const mesesGrafico = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const cargarDashboard = async () => {
    try {
      const [clientesRes, facturasRes, pagosRes, cuentasRes] =
        await Promise.all([
          fetch(`${API_URL}/facturas/clientes`, { cache: "no-store" }),
          fetch(`${API_URL}/facturas`, { cache: "no-store" }),
          fetch(`${API_URL}/pagos`, { cache: "no-store" }),
          fetch(`${API_URL}/cuentas-bancarias`, { cache: "no-store" }),
        ]);

      const clientes = clientesRes.ok ? await clientesRes.json() : [];
      const facturas = facturasRes.ok ? await facturasRes.json() : [];
      const pagos = pagosRes.ok ? await pagosRes.json() : [];
      const cuentas = cuentasRes.ok ? await cuentasRes.json() : [];

      const listaAnios = Array.from(
        new Set([
          ...facturas.map((f: any) => new Date(f.fechaEmision).getFullYear()),
          ...pagos.map((p: any) => new Date(p.fecha).getFullYear()),
        ]),
      ).sort();

      setAnios(listaAnios);

      const pagosFiltrados = pagos.filter((p: any) => {
        const fecha = new Date(p.fecha);

        const anio = fecha.getFullYear();

        const mes = fecha.getMonth() + 1;

        const cumpleAnio =
          anioSeleccionado === "Todos" || anio === Number(anioSeleccionado);

        const cumpleMes =
          mesSeleccionado === "Todos" ||
          mes === mesesFiltro.indexOf(mesSeleccionado);

        return cumpleAnio && cumpleMes;
      });
      const facturasFiltradas = facturas.filter((f: any) => {
        const fecha = new Date(f.fechaEmision);

        const anio = fecha.getFullYear();

        const mes = fecha.getMonth() + 1;

        const cumpleAnio =
          anioSeleccionado === "Todos" || anio === Number(anioSeleccionado);

        const cumpleMes =
          mesSeleccionado === "Todos" ||
          mes === mesesFiltro.indexOf(mesSeleccionado);

        return cumpleAnio && cumpleMes;
      });

      const resumen = mesesGrafico.map((mes) => ({
        mes,
        cobrado: 0,
        pendiente: 0,
      }));
      // Para el grafico
      pagosFiltrados.forEach((p: any) => {
        if (p.estado?.toLowerCase() !== "activo") return;

        const fecha = new Date(p.fecha);

        const mes = fecha.getMonth();

        resumen[mes].cobrado += Number(p.montoTotal);
      });
      facturasFiltradas.forEach((f: any) => {
        const fecha = new Date(f.fechaEmision);

        const mes = fecha.getMonth();

        resumen[mes].pendiente += Number(f.total);
      });
      // Gráfico de línea (muestra todos los meses)
      setGraficoLinea(resumen);

      // Gráfico de barras (solo meses con datos)
      setGraficoBarras(resumen.filter((m) => m.cobrado > 0 || m.pendiente > 0));
      // Total clientes
      const clientesUnicos = new Map(
        clientes.map((c: any) => [c.cedula || c.ruc || c.nombre, c]),
      );

      setTotalClientes(clientesUnicos.size);

      // Monto confirmado (solo pagos con PDF generado)
      const pagosConfirmados = pagosFiltrados.filter(
        (p: any) =>
          p.estado?.toLowerCase() === "activo" ||
          p.estado?.toLowerCase() === "impreso",
      );

      const montoConfirmado = pagosConfirmados.reduce(
        (sum: number, p: any) => sum + Number(p.montoTotal || 0),
        0,
      );

      setMontoConfirmado(montoConfirmado);

      let pendienteTotal = 0;
      const clientesDeuda = new Set();

      facturasFiltradas.forEach((factura: any) => {
        let pagado = 0;

        pagosFiltrados.forEach((pago: any) => {
          if (pago.estado?.toLowerCase() !== "activo") return;

          const detalle = pago.detalles?.find(
            (d: any) => d.facturaId === factura.id,
          );

          if (detalle) {
            pagado += Number(detalle.montoAbonado) || 0;
          }
        });

        const pendienteFactura = Math.max(0, factura.total - pagado);

        if (pendienteFactura > 0) {
          clientesDeuda.add(factura.clienteId);
          pendienteTotal += pendienteFactura;
        }
      });

      setClientesConDeuda(clientesDeuda.size);
      setPendiente(pendienteTotal);

      const deudaPorCliente = new Map();

      facturasFiltradas.forEach((factura: any) => {
        let pagado = 0;

        pagosFiltrados.forEach((pago: any) => {
          if (pago.estado?.toLowerCase() !== "activo") return;

          const detalle = pago.detalles?.find(
            (d: any) => d.facturaId === factura.id,
          );

          if (detalle) {
            pagado += Number(detalle.montoAbonado) || 0;
          }
        });

        const pendienteFactura = Math.max(0, factura.total - pagado);

        if (pendienteFactura > 0) {
          const cliente = clientes.find((c: any) => c.id === factura.clienteId);

          if (!cliente) return;

          const nombre = cliente.nombre;

          deudaPorCliente.set(
            nombre,
            (deudaPorCliente.get(nombre) || 0) + pendienteFactura,
          );
        }
      });
      const top = Array.from(deudaPorCliente.entries())
        .map(([cliente, pendiente]) => ({
          cliente,
          pendiente,
        }))
        .sort((a, b) => b.pendiente - a.pendiente)
        .slice(0, 5);

      setTopClientesDeuda(top);
      // Top 5 clientes con mas pagos
      const pagosPorCliente = new Map();

      pagosFiltrados.forEach((pago: any) => {
        if (
          pago.estado?.toLowerCase() !== "activo" &&
          pago.estado?.toLowerCase() !== "impreso"
        ) {
          return;
        }

        const cliente = clientes.find((c: any) => c.id === pago.clienteId);

        if (!cliente) return;

        const nombre = cliente.nombre;

        pagosPorCliente.set(
          nombre,
          (pagosPorCliente.get(nombre) || 0) + Number(pago.montoTotal || 0),
        );
      });

      const topPagos = Array.from(pagosPorCliente.entries())
        .map(([cliente, total]) => ({
          cliente,
          total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopClientesPagos(topPagos);

      const cuentasActivas = cuentas.filter((c: any) => c.estado === "ACTIVO");

      const estadoRes = await fetch(
        `${API_URL}/dashboard/estado-cuenta/detalle`,
        { cache: "no-store" },
      );

      const estado = await estadoRes.json();

      const donut = estado.map((c: any) => ({
        nombre: `${c.nombreBanco} - ${c.numeroCuenta}`,
        saldo: c.saldo_total,
      }));

      setGraficoCuentas(donut);
    } catch (error) {
      console.error(error);
    }
  };
  console.log("TopClientesDeudaChart:", TopClientesDeudaChart);
  console.log("TopClientesPagos:", topClientesPagos);

  return (
    <>
      <div className={styles.dashboardGrid}>
        {/* KPIs */}
        <div className={styles.kpiSection}>
          <div className={styles.kpis}>
            <KpiCard
              titulo="Monto confirmado"
              valor={`$${montoConfirmado.toFixed(2)}`}
              color="#16a34a"
            />
            <KpiCard
              titulo="Pendiente"
              valor={`$${pendiente.toFixed(2)}`}
              color="#dc2626"
            />
            <KpiCard
              titulo="Total clientes"
              valor={totalClientes}
              color="#2563eb"
            />

            <KpiCard
              titulo="Clientes con deuda"
              valor={clientesConDeuda}
              color="#ea580c"
            />
          </div>

          <div className={styles.filtrosGraficos}>
            <div>
              <label>Año</label>

              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
              >
                <option value="Todos">Todos</option>

                {anios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Mes</label>

              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
              >
                {mesesFiltro.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Donut */}
        <CuentaBancariaDonut data={graficoCuentas} />
        {/* Top deuda */}
        <TopClientesDeudaChart data={topClientesDeuda} />

        {/* Top pagos */}
        <TopClientesPagosChart data={topClientesPagos} />

        {/* Línea */}
        <CashFlowChart data={graficoLinea} />

        {/* Barras */}
        <CobradoPendienteChart data={graficoBarras} />
      </div>
    </>
  );
}
