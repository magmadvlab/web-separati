"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Building2, Calendar, ClipboardList, Settings, BarChart3, LogOut, User, FileText, Users, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function LaboratorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellLoading, setBellLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    if (!token && pathname !== "/laboratorio/login") {
      router.push("/laboratorio/login");
    }
  }, [pathname, router]);

  const loadPendingRequests = async () => {
    try {
      setBellLoading(true);
      const response = await api.get("/laboratori/dashboard/richieste-analisi", {
        params: { stato: "in_attesa" },
      });
      const payload = response?.data?.data ?? response?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.richieste)
        ? payload.richieste
        : [];
      setPendingRequests(list.length);
    } catch {
      setPendingRequests(0);
    } finally {
      setBellLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadPendingRequests();
    const timer = window.setInterval(loadPendingRequests, 60000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!bellOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!bellRef.current) return;
      if (event.target instanceof Node && !bellRef.current.contains(event.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [bellOpen]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
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
    { href: "/laboratorio/calendario", label: "Calendario", icon: Calendar },
    { href: "/laboratorio/richieste-analisi", label: "Richieste Analisi", icon: ClipboardList },
    { href: "/laboratorio/prenotazioni", label: "Prenotazioni", icon: ClipboardList },
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
        className="relative border-b bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent"
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
            <div className="flex items-center gap-3">
              <div className="relative" ref={bellRef}>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Notifiche"
                  onClick={() => setBellOpen((prev) => !prev)}
                  className="relative hover-lift"
                >
                  <Bell className="h-4 w-4" />
                  {pendingRequests > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {pendingRequests > 99 ? "99+" : pendingRequests}
                    </span>
                  )}
                </Button>

                {bellOpen && (
                  <div className="absolute right-0 z-[120] mt-2 w-80 rounded-md border bg-white shadow-lg">
                    <div className="border-b px-3 py-2">
                      <p className="text-sm font-semibold">Notifiche</p>
                      <p className="text-xs text-gray-500">
                        {pendingRequests > 0
                          ? `${pendingRequests} richieste analisi in attesa`
                          : "Nessuna richiesta in attesa"}
                      </p>
                    </div>
                    <div className="px-3 py-3">
                      {bellLoading ? (
                        <p className="text-sm text-gray-500">Caricamento...</p>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setBellOpen(false);
                            router.push("/laboratorio/richieste-analisi");
                          }}
                        >
                          Apri richieste analisi
                        </Button>
                      )}
                    </div>
                  </div>
                )}
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
