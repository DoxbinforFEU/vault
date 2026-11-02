import { displayName, statusOf } from "./userModel.js";

// Student-typed text (notes, categories) can start with = + - @ which spreadsheets
// treat as formulas, so those cells are prefixed with an apostrophe.
const esc = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(cols, rows) {
  return [cols.map((c) => esc(c.label)).join(","), ...rows.map((r) => cols.map((c) => esc(c.get(r))).join(","))].join("\r\n");
}
export function downloadCsv(filename, csv) {
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const pesos = (c) => (c / 100).toFixed(2);
const iso = (ts) => (ts ? new Date(ts).toISOString() : "");
const catName = (u, id) => u.categories.find((c) => c.id === id)?.name || "Uncategorized";

export const usersToCsv = (users) =>
  toCsv(
    [
      { label: "Account key", get: (u) => u.hash },
      { label: "Nickname", get: (u) => u.nickname },
      { label: "Notes", get: (u) => u.notes },
      { label: "Status", get: (u) => statusOf(u) },
      { label: "Test account", get: (u) => (u.isTest ? "yes" : "no") },
      { label: "Joined", get: (u) => iso(u.createdAt) },
      { label: "Last active", get: (u) => iso(u.lastActivity) },
      { label: "Transactions", get: (u) => u.txCount },
      { label: "Total spent", get: (u) => pesos(u.totalSpent) },
      { label: "Weekly allowance", get: (u) => pesos(u.weeklyAllowance) },
      { label: "Spend days/week", get: (u) => u.spendDays },
      { label: "Over budget this week", get: (u) => (u.overBudgetNow ? "yes" : "no") },
      { label: "Current streak (weeks)", get: (u) => u.streakCurrent },
    ],
    users
  );

export const activityToCsv = (users) =>
  toCsv(
    [
      { label: "Account key", get: (r) => r.u.hash },
      { label: "Name", get: (r) => displayName(r.u) },
      { label: "Date", get: (r) => iso(r.t.ts) },
      { label: "Category", get: (r) => catName(r.u, r.t.categoryId) },
      { label: "Note", get: (r) => r.t.note },
      { label: "Amount", get: (r) => pesos(r.t.amount) },
    ],
    users.flatMap((u) => u.transactions.map((t) => ({ u, t })))
  );

export const txToCsv = (u) =>
  toCsv(
    [
      { label: "Date", get: (t) => iso(t.ts) },
      { label: "Category", get: (t) => catName(u, t.categoryId) },
      { label: "Note", get: (t) => t.note },
      { label: "Amount", get: (t) => pesos(t.amount) },
    ],
    u.transactions
  );
