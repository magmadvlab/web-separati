type ExternalPortalRole =
  | "admin"
  | "delivery"
  | "farmacia"
  | "laboratorio"
  | "specialista";

const externalPortalUrls: Record<ExternalPortalRole, string | undefined> = {
  admin: process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL,
  delivery: process.env.NEXT_PUBLIC_DELIVERY_PORTAL_URL,
  farmacia: process.env.NEXT_PUBLIC_FARMACIA_PORTAL_URL,
  laboratorio: process.env.NEXT_PUBLIC_LABORATORIO_PORTAL_URL,
  specialista: process.env.NEXT_PUBLIC_SPECIALISTA_PORTAL_URL,
};

export function getExternalPortalUrl(role: ExternalPortalRole): string | null {
  const value = externalPortalUrls[role]?.trim();
  return value ? value.replace(/\/+$/, "") : null;
}
