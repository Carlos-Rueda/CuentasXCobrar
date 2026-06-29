import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import { ToastProvider } from "./components/toast";
import FetchInterceptor from "./components/FetchInterceptor";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="es" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <ToastProvider>
          <FetchInterceptor />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
