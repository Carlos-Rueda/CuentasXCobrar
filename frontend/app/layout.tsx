import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Cuentas por Cobrar",
  description: "Proyecto Integrador",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-100">
        <div className="flex h-screen">

          {/* Sidebar */}
          <aside className="w-72 bg-white shadow-lg flex flex-col border-r border-slate-200">

            <div className="p-8 border-b border-slate-200">
              <h1 className="text-4xl font-bold text-emerald-600">
                Cuentas por Cobrar              </h1>

              <p className="text-slate-500 mt-2">
                Sistema Financiero
              </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">

              <Link
                href="/dashboard"
                className="block rounded-xl px-4 py-3 text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 transition"
              >
                Dashboard
              </Link>

              <Link
                href="/clientes"
                className="block rounded-xl px-4 py-3 text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 transition"
              >
                Clientes
              </Link>

              <Link
                href="/facturas"
                className="block rounded-xl px-4 py-3 text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 transition"
              >
                Facturas
              </Link>

              <Link
                href="/pagos"
                className="block rounded-xl px-4 py-3 text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 transition"
              >
                Cobros
              </Link>

              <Link
                href="/reportes"
                className="block rounded-xl px-4 py-3 text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 transition"
              >
                Reportes
              </Link>

            </nav>

            <div className="border-t border-slate-200 p-5">

              <div className="mb-4">
                <p className="font-semibold text-slate-800">
                  Anahí López
                </p>

                <p className="text-sm text-slate-500">
                  Frontend UI/UX
                </p>
              </div>

              <button className="w-full rounded-xl bg-emerald-600 text-white py-3 font-medium hover:bg-emerald-700 transition">
                Cerrar Sesión
              </button>

            </div>

          </aside>

          {/* Contenido */}
          <div className="flex-1 flex flex-col">

            {/* Header */}
            <header className="h-20 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-8">

              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  Sistema de Cuentas por Cobrar
                </h2>
              </div>

              <div className="text-slate-500">
                Proyecto Integrador
              </div>

            </header>

            {/* Main */}
            <main className="flex-1 overflow-auto bg-slate-100 p-8">
              {children}
            </main>

          </div>

        </div>
      </body>
    </html>
  );
}