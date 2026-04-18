"use client";

import { Calendar, FileText, LayoutDashboard, Stethoscope, UserRound } from "lucide-react";

import { CompatPortalLayout } from "@/components/shared/CompatPortalLayout";

export default function SpecialistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompatPortalLayout
      areaLabel="Area Specialista"
      areaDescription="Portale specialista in formalizzazione come frontend dedicato."
      roleTarget="specialista"
      roleKey="specialista"
      icon={Stethoscope}
      accentClassName="border-cyan-200 text-cyan-700"
      navItems={[
        { href: "/specialista/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/specialista/pazienti", label: "Pazienti", icon: UserRound },
        { href: "/specialista/consulti", label: "Consulti", icon: FileText },
        { href: "/specialista/calendario", label: "Calendario", icon: Calendar },
        { href: "/specialista/profilo", label: "Profilo", icon: Stethoscope },
      ]}
    >
      {children}
    </CompatPortalLayout>
  );
}
