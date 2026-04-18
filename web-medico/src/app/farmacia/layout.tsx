"use client";

import { Calendar, Clock, FileText, Package, Pill, Store } from "lucide-react";

import { CompatPortalLayout } from "@/components/shared/CompatPortalLayout";

export default function FarmaciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompatPortalLayout
      areaLabel="Area Farmacia"
      areaDescription="Compatibilita' temporanea del portale farmacia ospitata in web-medico."
      roleTarget="farmacia"
      roleKey="farmacia"
      icon={Store}
      accentClassName="border-emerald-200 text-emerald-700"
      navItems={[
        { href: "/farmacia/dashboard", label: "Dashboard", icon: Store },
        { href: "/farmacia/ordini", label: "Ordini", icon: Package },
        { href: "/farmacia/catalogo", label: "Catalogo", icon: Pill },
        { href: "/farmacia/documenti", label: "Documenti", icon: FileText },
        { href: "/farmacia/calendario", label: "Calendario", icon: Calendar },
        { href: "/farmacia/orari", label: "Orari", icon: Clock },
      ]}
    >
      {children}
    </CompatPortalLayout>
  );
}
