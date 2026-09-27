// В localStorage хранятся ТОЛЬКО числа и даты предохранителя.
// Ни одного символа пользовательского текста здесь быть не может.
const LOCK_KEY = "bls_lock_until";
const SESSIONS_KEY = "bls_sessions_today";
const ESCALATIONS_KEY = "bls_escalations";

const isBrowser = () => typeof window !== "undefined";

export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function getLockUntil(): number {
  if (!isBrowser()) return 0;
  const raw = window.localStorage.getItem(LOCK_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function isLocked(): boolean {
  return getLockUntil() > Date.now();
}

export function setLockUntil(ts: number) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LOCK_KEY, String(Math.floor(ts)));
}

export function lockForHours(hours: number) {
  setLockUntil(Date.now() + hours * 60 * 60 * 1000);
}

export function lockUntilEndOfDay() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  setLockUntil(d.getTime());
}

export function getSessionsToday(): number {
  if (!isBrowser()) return 0;
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; count?: number };
    if (parsed?.date !== todayKey()) return 0;
    return typeof parsed.count === "number" ? parsed.count : 0;
  } catch {
    return 0;
  }
}

export function incrementSessionsToday(): number {
  if (!isBrowser()) return 0;
  const next = getSessionsToday() + 1;
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: todayKey(), count: next }));
  if (next >= 2) lockUntilEndOfDay();
  return next;
}

export function getEscalations(): number {
  if (!isBrowser()) return 0;
  const n = Number(window.localStorage.getItem(ESCALATIONS_KEY) ?? "0");
  return Number.isFinite(n) ? n : 0;
}

export function setEscalations(n: number) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ESCALATIONS_KEY, String(n));
}
