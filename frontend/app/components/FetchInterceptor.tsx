"use client";

import { useEffect } from "react";

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).__fetch_intercepted__) {
      (window as any).__fetch_intercepted__ = true;
      const originalFetch = window.fetch;
      
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      };

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const token = sessionStorage.getItem("auth_token") || 
                      sessionStorage.getItem("access_token") ||
                      localStorage.getItem("auth_token") || 
                      localStorage.getItem("token") || 
                      getCookie("auth_token") || 
                      getCookie("token");

        if (token) {
          const newInit = { ...init };
          const headers = new Headers(newInit.headers || {});
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          newInit.headers = headers;
          return originalFetch(input, newInit);
        }
        return originalFetch(input, init);
      };
    }
  }, []);

  return null;
}
