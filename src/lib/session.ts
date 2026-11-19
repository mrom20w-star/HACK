export interface UserSession {
  code: string;
  expiresAt: number | null;
}

export interface AccessCodeRecord {
  code: string;
  createdAt: number;
  expiresAt: number | null;
  durationLabel: string;
}

const SESSION_KEY = 'dark-vip-session';
const ADMIN_KEY = 'dark-vip-admin';
const CODES_STORAGE_KEY = 'iran-script-access-codes';

export function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserSession;
    if (!parsed?.code) return null;
    if (parsed.expiresAt !== null && parsed.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function grantAdminAccess(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ADMIN_KEY, '1');
}

export function isAdminAuthorized(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(ADMIN_KEY) === '1';
}

export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Local storage persistence for admin-created access keys
export function loadAccessCodes(): AccessCodeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CODES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AccessCodeRecord[];
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      : [];
  } catch {
    return [];
  }
}

export function saveAccessCode(record: AccessCodeRecord): void {
  if (typeof window === 'undefined') return;
  const existing = loadAccessCodes().filter((item) => item.code !== record.code);
  const updated = [record, ...existing];
  window.localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(updated));
}

export function deleteAccessCode(code: string): void {
  if (typeof window === 'undefined') return;
  const updated = loadAccessCodes().filter((item) => item.code !== code.trim());
  window.localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(updated));
}

