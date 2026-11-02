// Pure analytics for the Overview page: chart series, retention, budget health, alerts.
import { getWeekRange } from "../../lib/budget.js";
import { DAY, INACTIVE_DAYS, startOfDay, statusOf } from "./userModel.js";

export const median = (nums) => {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

const md = (ts) => {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

/** Monday-start week boundaries: n weeks ending with the current one (n+1 edges). */
function weekEdges(now, n) {
  const cur = getWeekRange(now, 1).start;
  return Array.from({ length: n + 1 }, (_, i) => {
    const d = new Date(cur);
    d.setDate(d.getDate() - (n - i) * 7 + (i === n ? 0 : 0));
    return d.getTime();
  }).map((t, i, a) => (i === n ? cur + 7 * DAY : t));
}

export function newUsersPerWeek(users, now, n = 8) {
  const e = weekEdges(now, n);
  return Array.from({ length: n }, (_, i) => ({
    label: md(e[i]),
    segments: [{ name: "New users", color: "#3B82F6", value: users.filter((u) => u.createdAt >= e[i] && u.createdAt < e[i + 1]).length }],
  }));
}

export function transactionsPerDay(users, now, n = 14) {
  const today = startOfDay(now);
  return Array.from({ length: n }, (_, i) => {
    const s = today - (n - 1 - i) * DAY;
    const value = users.reduce((c, u) => c + u.transactions.filter((t) => t.ts >= s && t.ts < s + DAY).length, 0);
    return { label: md(s), segments: [{ name: "Transactions", color: "#5B8C5A", value }] };
  });
}

/** Weekly spend stacked by the 4 biggest categories (matched by name) + Other. */
export function spendByCategoryPerWeek(users, now, n = 8) {
  const e = weekEdges(now, n);
  const totals = new Map();
  const colors = new Map();
  const cells = Array.from({ length: n }, () => new Map());
  users.forEach((u) =>
    u.transactions.forEach((t) => {
      if (t.ts < e[0] || t.ts >= e[n]) return;
      const i = e.findIndex((x, k) => k < n && t.ts >= x && t.ts < e[k + 1]);
      const c = u.categories.find((x) => x.id === t.categoryId);
      const name = c?.name || "Uncategorized";
      if (!colors.has(name)) colors.set(name, c?.color || "#888888");
      totals.set(name, (totals.get(name) || 0) + t.amount);
      cells[i].set(name, (cells[i].get(name) || 0) + t.amount);
    })
  );
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
  const bars = cells.map((m, i) => {
    const segments = top.map((name) => ({ name, color: colors.get(name), value: m.get(name) || 0 }));
    let other = 0;
    m.forEach((v, k) => { if (!top.includes(k)) other += v; });
    if (other) segments.push({ name: "Other", color: "#94A3B8", value: other });
    return { label: md(e[i]), segments };
  });
  const legend = top.map((name) => ({ name, color: colors.get(name) }));
  if (bars.some((b) => b.segments.some((s) => s.name === "Other"))) legend.push({ name: "Other", color: "#94A3B8" });
  return { bars, legend };
}

export function overviewStats(users, now = Date.now()) {
  const ws = (a, b) => users.filter((u) => u.transactions.some((t) => t.ts >= a && t.ts < b));
  const active7 = ws(now - 7 * DAY, now + 1);
  const prev7 = ws(now - 14 * DAY, now - 7 * DAY);
  const retained = prev7.filter((u) => u.transactions.some((t) => t.ts >= now - 7 * DAY));
  const withTx = users.filter((u) => u.txCount > 0);
  const activeWeeks = users.reduce((s, u) => s + u.activeWeeks, 0);
  const overWeeks = users.reduce((s, u) => s + u.overWeeks, 0);

  return {
    active7: active7.length,
    retention: prev7.length ? Math.round((retained.length / prev7.length) * 100) : null,
    avgStreak: withTx.length ? Math.round((withTx.reduce((s, u) => s + u.streakCurrent, 0) / withTx.length) * 10) / 10 : 0,
    medianAllowance: median(users.map((u) => u.weeklyAllowance).filter((v) => v > 0)),
    pctWeeksOver: activeWeeks ? Math.round((overWeeks / activeWeeks) * 100) : null,
    worst: users
      .filter((u) => u.overWeeks > 0 && u.activeWeeks >= 2)
      .sort((a, b) => b.overWeeks / b.activeWeeks - a.overWeeks / a.activeWeeks || b.overWeeks - a.overWeeks)
      .slice(0, 5),
    overNow: users.filter((u) => u.overBudgetNow),
    inactive: users.filter((u) => statusOf(u, now) === "inactive").sort((a, b) => a.lastActivity - b.lastActivity),
    // Single expense ≥ half of that student's weekly budget, in the last 7 days.
    large: users
      .flatMap((u) =>
        u.weekAllowance > 0
          ? u.transactions.filter((t) => t.ts >= now - 7 * DAY && t.amount >= u.weekAllowance / 2).map((t) => ({ u, t }))
          : []
      )
      .sort((a, b) => b.t.ts - a.t.ts)
      .slice(0, 10),
  };
}
export { INACTIVE_DAYS };
