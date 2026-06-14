export default function DashboardPage() {
  return (
    <div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Resumen general del sistema
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500">
            Clientes
          </p>

          <h2 className="text-4xl font-bold text-slate-800 mt-3">
            120
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500">
            Facturas
          </p>

          <h2 className="text-4xl font-bold text-slate-800 mt-3">
            350
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500">
            Cobros
          </p>

          <h2 className="text-4xl font-bold text-slate-800 mt-3">
            85
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500">
            Pendiente
          </p>

          <h2 className="text-4xl font-bold text-emerald-600 mt-3">
            $15,000
          </h2>
        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

        <h2 className="text-xl font-semibold text-slate-800 mb-6">
          Últimos Cobros
        </h2>

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-200">

              <th className="text-left py-3 text-slate-600">
                Cliente
              </th>

              <th className="text-left py-3 text-slate-600">
                Factura
              </th>

              <th className="text-left py-3 text-slate-600">
                Fecha
              </th>

              <th className="text-left py-3 text-slate-600">
                Valor
              </th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-b border-slate-100">
              <td className="py-4">Juan Pérez</td>
              <td>FAC-001</td>
              <td>12/06/2026</td>
              <td>$250</td>
            </tr>

            <tr className="border-b border-slate-100">
              <td className="py-4">María López</td>
              <td>FAC-002</td>
              <td>12/06/2026</td>
              <td>$430</td>
            </tr>

            <tr>
              <td className="py-4">Carlos Ruiz</td>
              <td>FAC-003</td>
              <td>11/06/2026</td>
              <td>$180</td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}