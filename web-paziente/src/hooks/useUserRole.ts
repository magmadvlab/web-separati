import { useAuthStore } from '@/stores/auth';
export function useUserRole() {
  const user = useAuthStore((s) => s.user);
  return user?.ruolo ?? null;
}
