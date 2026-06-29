"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/app/config";
import { useToast } from "@/app/components/toast";
import { Eye, EyeOff } from "lucide-react";

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
            rol: payload.rol || payload.role || "ADMIN",
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-red-700 leading-tight">
            Cuentas por<br />Cobrar
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sistema Financiero</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-slate-400 mb-6">Ingresa tus credenciales para continuar</p>

          {/* Usuario */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>

          {/* Contraseña */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Botón */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[var(--utn-red)] text-white font-medium py-3 rounded-xl hover:bg-[var(--utn-red-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Universidad Técnica del Norte · Sistema CXC
        </p>
      </div>
    </div>
  );
}