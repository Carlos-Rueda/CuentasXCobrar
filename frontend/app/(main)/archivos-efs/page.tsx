"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/config";
import { FileText, Download, Eye, RefreshCw, Search } from "lucide-react";

interface EfsFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function ArchivosEfsPage() {
  const [files, setFiles] = useState<EfsFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/reportes/efs-files`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("No se pudo obtener la lista de archivos de EFS");
      }
      const data = await response.json();
      setFiles(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileAction = async (filename: string, action: "view" | "download") => {
    try {
      setDownloadingFile(filename);
      const token = sessionStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/reportes/efs-files/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener el archivo del servidor.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      if (action === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(url, "_blank");
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      alert(err.message || "Error al procesar el archivo.");
    } finally {
      setDownloadingFile(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredFiles = files
    .filter((file) => file.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ color: "var(--utn-gray-dark)" }}>
            Explorador de Archivos EFS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza y descarga los comprobantes (PDF) y reportes (PDF/CSV) persistidos en el almacenamiento compartido de AWS EFS.
          </p>
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          style={{ color: "var(--utn-gray)" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Buscador y Resumen */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de archivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div className="text-sm text-gray-500 w-full md:w-auto text-right">
          Total: <span className="font-semibold text-gray-900">{filteredFiles.length}</span> archivos
        </div>
      </div>

      {/* Listado de Archivos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-red-600 mb-2" style={{ color: "var(--utn-red)" }} />
            <p className="text-sm text-gray-500">Cargando archivos de EFS...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 bg-red-50">
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-red-500 mt-1">Verifica que el backend esté encendido y tenga el volumen montado.</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No se encontraron archivos en EFS</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? "Prueba con otra búsqueda." : "Genera un estado de cuenta (PDF/CSV) o un comprobante para ver los archivos aquí."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre del Archivo</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tamaño</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFiles.map((file) => {
                  const isCsv = file.name.endsWith(".csv");
                  return (
                    <tr key={file.name} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {/* Botón para ver en línea */}
                          <button
                            onClick={() => handleFileAction(file.name, "view")}
                            disabled={downloadingFile !== null}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Visualizar
                          </button>
                          {/* Botón para descargar */}
                          <button
                            onClick={() => handleFileAction(file.name, "download")}
                            disabled={downloadingFile !== null}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ background: isCsv ? "#059669" : "var(--utn-red)" }}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ background: isCsv ? "#ECFDF5" : "var(--utn-red-light)" }}>
                            <FileText className="w-4 h-4" style={{ color: isCsv ? "#059669" : "var(--utn-red)" }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-md">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatBytes(file.size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(file.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
