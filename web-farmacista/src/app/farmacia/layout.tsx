"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";

export default function FarmaciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Evita redirect infiniti: controlla anche se siamo già sulla pagina di login
    if (typeof window !== "undefined" && window.location.pathname === "/login") {
      return;
    }
    
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (user?.ruolo !== "farmacista") {
      // Redirect alla dashboard appropriata per il ruolo
      if (user?.ruolo === "paziente") {
        router.push("/paziente/dashboard");
      } else if (user?.ruolo === "medico") {
        router.push("/medico/dashboard");
      } else if (user?.ruolo === "specialista") {
        router.push("/specialista/dashboard");
      } else if (user?.ruolo === "professionista_sanitario") {
        router.push("/professionista/dashboard");
      } else if (user?.ruolo === "rider") {
        router.push("/delivery/dashboard");
      } else if (user?.ruolo === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/login");
      }
      return;
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.ruolo !== "farmacista") {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="farmacista" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

