"use client";

import { Map, Package, Route, Stethoscope, Truck } from "lucide-react";

import { CompatPortalLayout } from "@/components/shared/CompatPortalLayout";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompatPortalLayout
      areaLabel="Area Delivery"
      areaDescription="Compatibilita' temporanea del portale delivery ospitata in web-medico."
      roleTarget="delivery"
      roleKey="delivery"
      icon={Truck}
      accentClassName="border-orange-200 text-orange-700"
      navItems={[
        { href: "/delivery/dashboard", label: "Dashboard", icon: Truck },
        { href: "/delivery/ordini", label: "Ordini", icon: Package },
        { href: "/delivery/richieste-dirette", label: "Richieste", icon: Stethoscope },
        { href: "/delivery/rotte", label: "Rotte", icon: Route },
        { href: "/delivery/profilo", label: "Profilo", icon: Map },
      ]}
    >
      {children}
    </CompatPortalLayout>
  );
}
