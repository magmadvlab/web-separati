"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/shared/Sidebar";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

export default function FornitoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const isFornitore = user?.ruolo === "fornitore_sanitario" || user?.ruolo === "fornitore";

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?role=fornitore_sanitario");
    } else if (!isFornitore) {
      router.push("/");
    }
  }, [isAuthenticated, isFornitore, router]);

  if (!isAuthenticated || !isFornitore) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="fornitore_sanitario" />
      <main className="flex-1 overflow-y-auto">
        {/* WEB-08: Banner portale in sviluppo */}
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span>Portale in fase di sviluppo</span>
          <Badge variant="outline" className="ml-1 border-amber-400 text-amber-700">Beta</Badge>
          <span className="text-amber-600">— alcune funzionalità potrebbero non essere ancora disponibili.</span>
        </div>
        {children}
      </main>
    </div>
  );
}
