"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authStorage } from "@/lib/auth-storage";
import { Building2, Calendar, Settings, BarChart3, LogOut, User, FileText, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function LaboratorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = authStorage.getAccessToken();
    setIsAuthenticated(!!token);
    if (!token && pathname !== "/laboratorio/login") {
      router.push("/laboratorio/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    authStorage.clearAllAuth();
    router.push("/laboratorio/login");
  };

  if (pathname === "/laboratorio/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: "/laboratorio/dashboard", label: "Dashboard", icon: Building2 },
    { href: "/laboratorio/prenotazioni", label: "Prenotazioni", icon: Calendar },
    { href: "/laboratorio/pazienti-walkin", label: "Pazienti Walk-in", icon: Users },
    { href: "/laboratorio/referti", label: "Referti", icon: FileText },
    { href: "/laboratorio/servizi", label: "Servizi", icon: Settings },
    { href: "/laboratorio/statistiche", label: "Statistiche", icon: BarChart3 },
    { href: "/laboratorio/profilo", label: "Profilo", icon: User },
  ];

  const sidebarVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con gradiente e shimmer */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden border-b bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10 container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Dashboard Laboratorio
              </h1>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" onClick={handleLogout} className="hover-lift">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64">
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={sidebarVariants}
              className="space-y-2"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <motion.div key={item.href} variants={itemVariants}>
                    <Link
                      href={item.href}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover-lift ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="laboratorio-active-indicator"
                          className="absolute inset-y-0 left-0 w-1 rounded-full bg-blue-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>
          </aside>

          <main className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="animate-fade-in"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
