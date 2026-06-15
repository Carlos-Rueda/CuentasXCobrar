import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "Sistema de Cuentas por Cobrar",
  description: "Proyecto Integrador",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}