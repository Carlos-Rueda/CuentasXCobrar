export default function DashboardPage() {
  const metricas = [
    { label: "Clientes",  value: "120",     color: "text-gray-900"    },
    { label: "Facturas",  value: "350",     color: "text-gray-900"    },
    { label: "Pagos",     value: "85",      color: "text-gray-900"    },
    { label: "Pendiente", value: "$15,000", color: "text-red-600"     },
  ];

  const ultimos = [
    { cliente: "Juan Pérez",   factura: "FAC-001", fecha: "12/06/2026", valor: "$250" },
    { cliente: "María López",  factura: "FAC-002", fecha: "12/06/2026", valor: "$430" },
    { cliente: "Carlos Ruiz",  factura: "FAC-003", fecha: "11/06/2026", valor: "$180" },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Título de página ── */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricas.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="metric-label mb-2">{label}</p>
            <p className={`metric-value ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Últimos pagos ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title">Últimos Pagos</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Cliente", "Factura", "Fecha", "Valor"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ultimos.map((r) => (
              <tr key={r.factura} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.cliente}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{r.factura}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{r.fecha}</td>
                <td className="px-5 py-3 text-sm font-semibold text-gray-900">{r.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
