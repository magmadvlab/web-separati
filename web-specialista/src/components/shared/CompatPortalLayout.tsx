"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getExternalPortalUrl } from "@/lib/role-portals";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type CompatPortalLayoutProps = {
  areaLabel: string;
  areaDescription: string;
  roleTarget: string;
  roleKey: "admin" | "delivery" | "farmacia" | "laboratorio" | "specialista";
  icon: LucideIcon;
  accentClassName: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

export function CompatPortalLayout({
  areaLabel,
  areaDescription,
  roleTarget,
  roleKey,
  icon: Icon,
  accentClassName,
  navItems,
  children,
}: CompatPortalLayoutProps) {
  const pathname = usePathname();
  const externalPortalUrl = getExternalPortalUrl(roleKey);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border bg-white",
                  accentClassName
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{areaLabel}</h1>
                <p className="text-sm text-slate-600">{areaDescription}</p>
              </div>
            </div>

            <div className="max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Area transitoria nel repository `web-specialista`</p>
              <p className="mt-1">
                Questo blocco resta disponibile solo come compatibilita' temporanea. Il target
                architetturale resta il frontend dedicato del ruolo <strong>{roleTarget}</strong>.
              </p>
              {externalPortalUrl ? (
                <p className="mt-2">
                  Frontend canonico configurato:{" "}
                  <a
                    href={externalPortalUrl}
                    className="font-medium underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {externalPortalUrl}
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowRight className="mr-2 h-4 w-4" />
                Torna al portale medico
              </Button>
            </Link>
            {externalPortalUrl ? (
              <a href={externalPortalUrl} target="_blank" rel="noreferrer">
                <Button size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apri portale dedicato
                </Button>
              </a>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Accesso comune
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="w-64 shrink-0">
          <nav className="space-y-2 rounded-lg border bg-white p-3">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const active =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <ItemIcon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
