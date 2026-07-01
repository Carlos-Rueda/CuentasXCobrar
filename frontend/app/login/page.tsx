"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/app/config";
import { useToast } from "@/app/components/toast";
import { Eye, EyeOff, User, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirigir al dashboard si ya hay una sesión activa en esta pestaña
  useEffect(() => {
    const token = sessionStorage.getItem("auth_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async () => {
    if (!usuario.trim() || !contrasena.trim()) {
      showToast("Ingrese su usuario y contraseña", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario.trim(),
          clave: contrasena.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data?.message || "Credenciales incorrectas", "error");
        return;
      }

      if (data.success && data.token) {
        // Guardar token en sessionStorage (para aislamiento estricto de pestañas)
        sessionStorage.setItem("auth_token", data.token);
        sessionStorage.setItem("access_token", data.token); // compatibilidad

        // Decodificar token para extraer información del usuario si está disponible
        let userObj = { nombre: "Usuario", rol: "ADMIN" };
        try {
          const base64Url = data.token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(window.atob(base64));
          
          // Intentar obtener el nombre/usuario desde el payload o usar el ingresado
          const rawNombre = payload.nombre || payload.name || payload.usuario || payload.username || payload.sub;
          const nombreFormateado = rawNombre 
            ? (rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1)) 
            : (usuario.trim() ? (usuario.trim().charAt(0).toUpperCase() + usuario.trim().slice(1)) : "Usuario");
 
          userObj = {
            nombre: nombreFormateado,
            rol: payload.rol || payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles) || "ADMIN",
          };
        } catch (e) {
          // Fallback al usuario ingresado si falla la decodificación
          const fallbackNombre = usuario.trim() ? (usuario.trim().charAt(0).toUpperCase() + usuario.trim().slice(1)) : "Usuario";
          userObj = { nombre: fallbackNombre, rol: "ADMIN" };
        }
        sessionStorage.setItem("user", JSON.stringify(userObj));

        showToast(data.message || "Autenticación exitosa", "success");
        router.push("/dashboard");
      } else {
        showToast(data?.message || "Error al iniciar sesión", "error");
      }
    } catch {
      showToast("No se pudo conectar con el servidor. Verifique que el backend esté encendido.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Subtle UTN Red Glow Accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-red-100/50 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-red-50/60 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Card Contenedora */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100 p-8 md:p-10 transition-all duration-300">
          
          {/* Header del Formulario */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/utn.png"
                alt="UTN Logo"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
                }}
              />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ display: "none", background: "var(--utn-red)" }}>
                <span className="text-white font-black text-lg">UTN</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Cuentas por Cobrar
            </h1>
            <p className="text-xs text-[var(--utn-red)] mt-1.5 uppercase tracking-wider font-bold">
              Universidad Técnica del Norte
            </p>
          </div>

          {/* Campo: Usuario */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[var(--utn-red)] focus:ring-2 focus:ring-red-100 transition-all duration-200"
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-12 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[var(--utn-red)] focus:ring-2 focus:ring-red-100 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[var(--utn-red)] hover:bg-[var(--utn-red-dark)] text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.005] active:scale-[0.995] text-sm shadow-md shadow-red-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}