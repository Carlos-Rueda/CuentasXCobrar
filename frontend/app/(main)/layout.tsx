"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/clientes",  label: "Clientes",  icon: "👥" },
  { href: "/facturas",  label: "Facturas",  icon: "🧾" },
  { href: "/pagos",     label: "Cobros",    icon: "💳" },
  { href: "/reportes",  label: "Reportes",  icon: "📊" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const userRef  = useRef<{ nombre: string; rol: string } | null>(null);
  const [user, setUser] = useState<{ nombre: string; rol: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored && !userRef.current) {
      userRef.current = JSON.parse(stored);
      setUser(JSON.parse(stored));
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="px-6 py-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-emerald-600 leading-tight">
            Cuentas por<br />Cobrar
          </h1>
          <p className="text-xs text-slate-400 mt-1">Sistema Financiero</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
              {user?.nombre?.[0] ?? "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.nombre ?? "Anahí López"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.rol ?? "Frontend UI/UX"}</p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="w-full text-sm font-medium py-2 px-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-700">Sistema de Cuentas por Cobrar</h2>
          <span className="text-xs text-slate-400">Proyecto Integrador</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}