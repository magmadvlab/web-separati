"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  User,
  LogOut,
  MapPin,
  Package,
  Pill,
  ClipboardList,
  RefreshCw,
  ClipboardCheck,
  BarChart3,
  MessageSquare,
  AlertCircle,
  Users,
  Shield,
  Mail,
  HelpCircle,
  BookOpen,
  CreditCard,
  PawPrint,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";

interface SidebarProps {
  role: "paziente" | "medico" | "specialista" | "farmacista" | "rider" | "admin";
}

const menuItems = {
  paziente: [
    { href: "/paziente/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/paziente/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/paziente/terapie", label: "Terapie", icon: Pill },
    { href: "/paziente/prescrizioni", label: "Prescrizioni", icon: FileText },
    { href: "/paziente/ordini", label: "Ordini", icon: ShoppingCart },
    { href: "/paziente/cartella-clinica", label: "Cartella Clinica", icon: ClipboardList },
    { href: "/paziente/consulti", label: "Consulti", icon: MessageSquare },
    { href: "/paziente/messaggi", label: "Messaggi", icon: Mail },
    { href: "/paziente/deleghe", label: "Caregiver", icon: Users },
    { href: "/paziente/profilo/animali", label: "Animali", icon: PawPrint },
    { href: "/paziente/shop", label: "Shop", icon: MapPin },
    { href: "/paziente/abbonamento", label: "Abbonamento", icon: CreditCard },
    { href: "/paziente/profilo", label: "Profilo", icon: User },
  ],
  medico: [
    { href: "/medico/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/medico/dashboard/full", label: "Dashboard Completa", icon: LayoutDashboard },
    { href: "/medico/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/medico/calendario", label: "Calendario", icon: Calendar },
    { href: "/medico/consulti", label: "Consulti", icon: MessageSquare },
    { href: "/medico/messaggi", label: "Messaggi", icon: Mail },
    { href: "/medico/richieste-prescrizione", label: "Richieste Prescrizione", icon: ClipboardList },
    { href: "/medico/richieste-rinnovo", label: "Richieste Rinnovo", icon: RefreshCw },
    { href: "/medico/richieste-analisi", label: "Richieste Analisi", icon: ClipboardList },
    { href: "/medico/prescrizioni", label: "Prescrizioni", icon: FileText },
    { href: "/medico/prescrizione-diretta", label: "Prescrizione Diretta", icon: FileText },
    { href: "/medico/pazienti", label: "Pazienti", icon: User },
    { href: "/medico/profilo", label: "Profilo", icon: User },
  ],
  specialista: [
    { href: "/specialista/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/specialista/pazienti", label: "Pazienti", icon: Users },
    { href: "/specialista/calendario", label: "Calendario", icon: Calendar },
    { href: "/specialista/consulti", label: "Consulti", icon: MessageSquare },
    { href: "/specialista/profilo", label: "Profilo", icon: User },
  ],
  farmacista: [
    { href: "/farmacia/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/farmacia/calendario", label: "Calendario", icon: Calendar },
    { href: "/farmacia/ordini", label: "Ordini", icon: ShoppingCart },
    { href: "/farmacia/catalogo", label: "Catalogo", icon: FileText },
    { href: "/farmacia/shop", label: "Shop", icon: MapPin },
    { href: "/farmacia/profilo", label: "Profilo", icon: User },
  ],
  rider: [
    { href: "/delivery/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/delivery/ordini", label: "Ordini", icon: ShoppingCart },
    { href: "/delivery/richieste-dirette", label: "Richieste Dirette", icon: MessageSquare },
    { href: "/delivery/rotte", label: "Rotte", icon: MapPin },
    { href: "/delivery/profilo", label: "Profilo", icon: User },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/riders", label: "Riders", icon: Package },
    { href: "/admin/ordini", label: "Ordini Disponibili", icon: Package },
    { href: "/admin/users", label: "Utenti", icon: User },
    { href: "/admin/statistics", label: "Statistiche", icon: FileText },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const items = menuItems[role] || [];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50 z-10">
      <div className="flex h-16 items-center border-b px-6 bg-white">
        <h1 className="text-xl font-bold text-primary">RicettaZero</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover-lift",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
