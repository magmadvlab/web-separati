"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole, useHasRole } from "@/hooks/useUserRole";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/api";
import { Loading } from "@/components/shared/Loading";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: User["ruolo"][];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente per proteggere route basate sul ruolo utente
 * 
 * @param children - Contenuto da renderizzare se il ruolo è autorizzato
 * @param allowedRoles - Array di ruoli autorizzati ad accedere
 * @param redirectTo - Path di redirect se il ruolo non è autorizzato (default: "/login")
 * @param fallback - Componente da renderizzare durante il controllo (default: Loading)
 */
export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = "/login",
  fallback = <Loading />,
}: RoleGuardProps) {
  const router = useRouter();
  const userRole = useUserRole();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Se l'utente non è autenticato, reindirizza al login
    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }

    // Se il ruolo non è autorizzato, reindirizza
    if (userRole && !allowedRoles.includes(userRole)) {
      // Reindirizza alla dashboard appropriata in base al ruolo
      switch (userRole) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "medico":
          router.push("/medico/dashboard");
          break;
        case "specialista":
          router.push("/specialista/dashboard");
          break;
        case "farmacista":
          router.push("/farmacia/dashboard");
          break;
        case "rider":
          router.push("/delivery/dashboard");
          break;
        case "paziente":
          router.push("/dashboard");
          break;
        default:
          router.push(redirectTo);
      }
    }
  }, [userRole, isAuthenticated, user, allowedRoles, redirectTo, router]);

  // Se non autenticato o ruolo non autorizzato, mostra fallback durante redirect
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Ruolo autorizzato, renderizza children
  return <>{children}</>;
}

/**
 * Hook helper per verificare se l'utente può accedere a una route
 */
export function useCanAccess(allowedRoles: User["ruolo"][]): boolean {
  const userRole = useUserRole();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !userRole) {
    return false;
  }

  return allowedRoles.includes(userRole);
}


