// ---------------------------------------------------------------------------
// Pure admin logic (no network): turn a `budgets` row into a user summary, then
// filter / sort / paginate. Money is integer centavos, same as the student app.
// ---------------------------------------------------------------------------
import { getWeekRange, weekKey, getAllowanceForWeek, weekTransactions } from "../../lib/budget.js";
import { streaks } from "../../lib/insights.js";

export const DAY = 86400000;
export const PAGE_SIZE = 10;
export const ACTIVE_DAYS = 7;
export const INACTIVE_DAYS = 14;

export const SORTS = [
  { key: "lastActivity", label: "Last active" },
  { key: "txCount", label: "Transactions" },
  { key: "totalSpent", label: "Total spent" },
  { key: "createdAt", label: "Joined" },
  { key: "name", label: "Name / key (A–Z)" },
];
export const STATUSES = [
  { key: "all", label: "All users" },
  { key: "active", label: "Active (7 days)" },
  { key: "inactive", label: "Inactive (14+ days)" },
  { key: "never", label: "Never logged" },
  { key: "over", label: "Over budget this week" },
];
export const RANGES = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "custom", label: "Custom range" },
];
export const RANGE_ALL = { key: "all", from: "", to: "" };

const sum = (txs) => txs.reduce((s, t) => s + (t.amount || 0), 0);
const arr = (v) => (Array.isArray(v) ? v : []);
export const startOfDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const shortKey = (hash) => (hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash);
export const displayName = (u) => u.nickname || shortKey(u.hash);

export function timeAgo(ts, now = Date.now()) {
  if (!ts) return "never";
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export const fmtDateTime = (ts) =>
  new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * Row → summary. Accepts the lean shape (transactions / categories / allowance …
 * selected straight out of the JSON) or the full shape (`data` blob).
 */
export function summarize(row, now = Date.now()) {
  const d = row.data || {};
  const s = d.settings || {};
  const transactions = arr(row.transactions ?? d.transactions).slice().sort((a, b) => b.ts - a.ts);
  const categories = arr(row.categories ?? d.categories);
  const overrides = row.overrides ?? d.weekOverrides ?? {};
  const settings = {
    weeklyAllowance: row.allowance ?? s.weeklyAllowance ?? 0,
    weekStartDay: row.weekStart ?? s.weekStartDay ?? 1,
    spendDaysPerWeek: row.spendDays ?? s.spendDaysPerWeek ?? 7,
    currencySymbol: row.symbol ?? s.currencySymbol ?? "₱",
  };
  const wsd = settings.weekStartDay;
  const updatedAt = Date.parse(row.updated_at) || 0;

  const cur = getWeekRange(now, wsd);
  const thisWeekSpent = sum(weekTransactions(transactions, cur));
  const weekAllowance = getAllowanceForWeek(weekKey(now, wsd), settings, overrides);

  // Completed weeks with activity, and how many ended over budget.
  let activeWeeks = 0;
  let overWeeks = 0;
  if (transactions.length) {
    let r = getWeekRange(transactions[transactions.length - 1].ts, wsd);
    let guard = 0;
    while (r.start < cur.start && guard++ < 520) {
      const t = weekTransactions(transactions, r);
      if (t.length) {
        activeWeeks++;
        const allw = getAllowanceForWeek(weekKey(r.start, wsd), settings, overrides);
        if (allw > 0 && sum(t) > allw) overWeeks++;
      }
      r = getWeekRange(r.start + 7 * DAY, wsd);
    }
  }
  const st = streaks(transactions, settings, overrides, now);

  return {
    hash: row.hash,
    nickname: row.nickname || "",
    notes: row.notes || "",
    isTest: Boolean(row.is_test),
    name: (row.nickname || row.hash).toLowerCase(),
    createdAt: Date.parse(row.created_at) || 0,
    updatedAt,
    lastActivity: transactions[0]?.ts ?? updatedAt,
    txCount: transactions.length,
    totalSpent: sum(transactions),
    transactions,
    categories,
    settings,
    overrides,
    symbol: settings.currencySymbol,
    weeklyAllowance: settings.weeklyAllowance,
    spendDays: settings.spendDaysPerWeek,
    hasDreamGoal: Boolean(row.goal ?? s.dreamGoal),
    thisWeekSpent,
    weekAllowance,
    overBudgetNow: weekAllowance > 0 && thisWeekSpent > weekAllowance,
    activeWeeks,
    overWeeks,
    streakCurrent: st.current,
    streakBest: st.longest,
  };
}

/** active | quiet (8–13 days) | inactive | never */
export function statusOf(u, now = Date.now()) {
  if (u.txCount === 0) return "never";
  if (u.lastActivity >= now - ACTIVE_DAYS * DAY) return "active";
  if (u.lastActivity < now - INACTIVE_DAYS * DAY) return "inactive";
  return "quiet";
}

export function matchesStatus(u, key, now = Date.now()) {
  if (key === "all") return true;
  if (key === "over") return u.overBudgetNow;
  return statusOf(u, now) === key;
}

/** {start,end} ms for a date-range filter, or null for "all time". */
export function rangeBounds(range, now = Date.now()) {
  const today = startOfDay(now);
  switch (range.key) {
    case "today": return { start: today, end: today + DAY };
    case "7d": return { start: today - 6 * DAY, end: today + DAY };
    case "30d": return { start: today - 29 * DAY, end: today + DAY };
    case "custom": {
      let s = range.from ? new Date(range.from + "T00:00:00").getTime() : NaN;
      let e = range.to ? new Date(range.to + "T00:00:00").getTime() + DAY : NaN;
      s = Number.isFinite(s) ? s : -Infinity;
      e = Number.isFinite(e) ? e : Infinity;
      return s === -Infinity && e === Infinity ? null : { start: s, end: e };
    }
    default: return null;
  }
}

/** Restrict each user's transactions to the range (recomputing totals); drop users with none. */
export function applyRange(users, range, now = Date.now()) {
  const b = rangeBounds(range, now);
  if (!b) return users;
  return users
    .map((u) => {
      const tx = u.transactions.filter((t) => t.ts >= b.start && t.ts < b.end);
      return { ...u, transactions: tx, txCount: tx.length, totalSpent: sum(tx), lastActivity: tx[0]?.ts ?? u.lastActivity };
    })
    .filter((u) => u.txCount > 0);
}

/** status → date range → search (key, name, notes) → sort. Returns the full list (all pages). */
export function filterSortUsers(users, { query = "", sortKey = "lastActivity", dir = "desc", status = "all", range = RANGE_ALL, now = Date.now() } = {}) {
  let list = status === "all" ? users : users.filter((u) => matchesStatus(u, status, now));
  list = applyRange(list, range, now);
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (u) => u.hash.toLowerCase().includes(q) || u.nickname.toLowerCase().includes(q) || u.notes.toLowerCase().includes(q)
    );
  }
  return [...list].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const c = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return dir === "asc" ? c : -c;
  });
}

export function paginate(list, page = 0, pageSize = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const p = Math.min(Math.max(page, 0), pages - 1);
  return {
    items: list.slice(p * pageSize, (p + 1) * pageSize),
    total: list.length,
    page: p,
    pages,
    from: list.length ? p * pageSize + 1 : 0,
    to: Math.min(list.length, (p + 1) * pageSize),
  };
}

export const queryUsers = (users, opts = {}) => paginate(filterSortUsers(users, opts), opts.page, opts.pageSize);
