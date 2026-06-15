// frontend/app/login/layout.tsx
// Este layout reemplaza el RootLayout SOLO para la página de login
// Al no tener sidebar ni header, el login se muestra solo

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}