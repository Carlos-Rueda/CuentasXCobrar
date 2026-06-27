"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  Users,
  CreditCard,
  BarChart3,
  Landmark,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",         label: "Dashboard",         Icon: LayoutGrid },
  { href: "/clientes",          label: "Clientes",          Icon: Users       },
  { href: "/pagos/reporte",     label: "Pagos",             Icon: CreditCard  },
  { href: "/reportes",          label: "Reportes",          Icon: BarChart3   },
  { href: "/cuentas-bancarias", label: "Cuentas Bancarias", Icon: Landmark    },
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
    <div className="flex h-screen" style={{ background: "var(--background)", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--utn-red)" }}>
              <span className="text-white font-black text-sm">CXC</span>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight" style={{ color: "var(--utn-gray-dark)" }}>
                Cuentas por Cobrar
              </h1>
              <p className="text-xs" style={{ color: "var(--utn-gray)" }}>Sistema Financiero</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? { background: "var(--utn-red-light)", color: "var(--utn-red)" }
                    : { color: "var(--utn-gray)" }
                }
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "var(--utn-red)" }}>
              {user?.nombre?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--utn-gray-dark)" }}>
                {user?.nombre ?? "Usuario"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--utn-gray)" }}>
                {user?.rol ?? "ADMIN"}
              </p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 px-3 rounded-lg border border-gray-200 transition-colors"
            style={{ color: "var(--utn-gray)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--utn-red)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--utn-red-light)"; (e.currentTarget as HTMLElement).style.background = "var(--utn-red-light)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--utn-gray)"; (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
          <h2 className="text-sm font-semibold" style={{ color: "var(--utn-gray-dark)" }}>
            Sistema de Cuentas por Cobrar — UTN
          </h2>
          <span className="text-xs" style={{ color: "var(--utn-gray)" }}>Universidad Técnica del Norte</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
