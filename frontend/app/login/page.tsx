"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [usuario,    setUsuario]    = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!usuario.trim() || !contrasena.trim()) {
      setError("Ingrese su usuario y contraseña");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/cxc/auth/login-mock", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          usuario:    usuario.trim(),
          contrasena: contrasena.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // El backend lanza 401 con mensaje en data.message
        setError(data?.message || "Credenciales inválidas");
        return;
      }

      // Guardar sesión en localStorage
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir al dashboard
      router.push("/dashboard");

    } catch {
      setError("No se pudo conectar con el servidor. Verifique que el backend esté corriendo en el puerto 3000.");
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
          <h1 className="text-2xl font-bold text-emerald-600 leading-tight">
            Cuentas por<br />Cobrar
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sistema Financiero</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-slate-400 mb-6">Ingresa tus credenciales para continuar</p>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {/* Usuario */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Contraseña */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={e => { setContrasena(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Botón */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-medium py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </div>

        {/* Credencial de prueba */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700 mb-2">Credencial de prueba:</p>
          <button
            type="button"
            onClick={() => { setUsuario("admin"); setContrasena("admin123"); setError(""); }}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            usuario: admin / contraseña: admin123
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Proyecto Integrador · Sistema CXC
        </p>
      </div>
    </div>
  );
}