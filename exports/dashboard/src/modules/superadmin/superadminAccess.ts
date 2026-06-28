import { getStoredSession } from '../../api/authSession';

const DEFAULT_OWNER_EMAIL = 'adib.hakimi19@gmail.com';

function getRuntimeEnv(): Record<string, string | undefined> {
  return ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});
}

export function getConfiguredOwnerEmail(env: Record<string, string | undefined> = getRuntimeEnv()) {
  return env.VITE_SUPERADMIN_EMAIL || DEFAULT_OWNER_EMAIL;
}

export function canAccessSuperadmin(currentEmail: string | undefined, ownerEmail = getConfiguredOwnerEmail()) {
  if (!currentEmail) {
    return false;
  }

  return currentEmail.trim().toLowerCase() === ownerEmail.trim().toLowerCase();
}

export function getCurrentAdminEmail() {
  return getStoredSession()?.user.email || getRuntimeEnv().VITE_CURRENT_ADMIN_EMAIL || '';
}
