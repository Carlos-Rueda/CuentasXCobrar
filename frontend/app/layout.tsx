import type { Metadata } from "next";
import "./global.css";
import { ToastProvider } from "./components/toast";

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
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
