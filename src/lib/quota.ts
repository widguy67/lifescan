export type PremiumPlan = "monthly" | "yearly";

export interface QuotaState {
  date: string; // YYYY-MM-DD of the tracked day
  used: number; // free + bonus scans used today
  bonus: number; // extra scans earned today by watching ads
  premium: boolean;
  plan: PremiumPlan | null;
  premiumSince: number | null;
}

export const FREE_DAILY_SCANS = 2;

export const PRICING = {
  monthly: { price: "€5.99", period: "month", amount: 5.99 },
  yearly: { price: "€49.99", period: "year", amount: 49.99 },
} as const;

const KEY = "scany.quota.v1";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaults(): QuotaState {
  return {
    date: todayKey(),
    used: 0,
    bonus: 0,
    premium: false,
    plan: null,
    premiumSince: null,
  };
}

function read(): QuotaState {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = { ...defaults(), ...(JSON.parse(raw) as Partial<QuotaState>) };
    // Reset the per-day counters when the day changes (premium status persists).
    if (parsed.date !== todayKey()) {
      parsed.date = todayKey();
      parsed.used = 0;
      parsed.bonus = 0;
    }
    return parsed;
  } catch {
    return defaults();
  }
}

function write(state: QuotaState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("scany:quota"));
}

export function getQuota(): QuotaState {
  const state = read();
  // Persist any day-rollover reset so reads stay consistent.
  write(state);
  return state;
}

export function isPremium(): boolean {
  return read().premium;
}

/** Scans still available today (Infinity for premium members). */
export function remainingScans(): number {
  const state = read();
  if (state.premium) return Infinity;
  return Math.max(0, FREE_DAILY_SCANS + state.bonus - state.used);
}

export function canScan(): boolean {
  return remainingScans() > 0;
}

/** Records one consumed scan. No-op for premium members. */
export function recordScan() {
  const state = read();
  if (state.premium) return;
  state.used += 1;
  write(state);
}

/** Grants one extra scan for today after watching a rewarded ad. */
export function grantBonusScan() {
  const state = read();
  if (state.premium) return;
  state.bonus += 1;
  write(state);
}

export function activatePremium(plan: PremiumPlan) {
  const state = read();
  state.premium = true;
  state.plan = plan;
  state.premiumSince = Date.now();
  write(state);
}

export function cancelPremium() {
  const state = read();
  state.premium = false;
  state.plan = null;
  state.premiumSince = null;
  write(state);
}
