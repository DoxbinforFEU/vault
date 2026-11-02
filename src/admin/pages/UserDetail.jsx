import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney, computeHistory, computeCategoryBreakdown } from "../../lib/budget.js";
import HistoryChart from "../../components/HistoryChart.jsx";
import CategoryBreakdown from "../../components/CategoryBreakdown.jsx";
import EditSheet from "../../components/EditSheet.jsx";
import { fetchUserFull, saveUserMeta, saveTransactions } from "../lib/adminData.js";
import { summarize, displayName, fmtDateTime, timeAgo } from "../lib/userModel.js";
import { txToCsv, downloadCsv } from "../lib/csv.js";
import { StatusBadge, pillBtn } from "../components/UserListControls.jsx";
import TxRow from "../components/TxRow.jsx";

const card = "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm";
const field =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sapphire/40 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50";
const RANGES = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "3m", label: "3 Months" },
  { key: "year", label: "1 Year" },
];

function Stat({ label, value, sub }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/** Full view of one student: profile notes, stats, the same charts the student sees, editable transactions. */
export default function UserDetail({ hash, onBack, onChanged, onDelete }) {
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("month");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ nickname: "", notes: "", isTest: false });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetchUserFull(hash);
      setRow(r);
      setDraft({ nickname: r.nickname || "", notes: r.notes || "", isTest: Boolean(r.is_test) });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [hash]);
  useEffect(() => { load(); }, [load]);

  const user = useMemo(() => (row ? summarize(row) : null), [row]);

  if (error)
    return (
      <div>
        <button onClick={onBack} className="mb-4 text-sm font-semibold text-sapphire">‹ Back</button>
        <div role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
        <button onClick={load} className={`${pillBtn} mt-3`}>Retry</button>
      </div>
    );
  if (!user)
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sapphire border-t-transparent" />
      </div>
    );

  const sym = user.symbol;
  const history = computeHistory(user.transactions, mode, user.settings, user.overrides);
  const breakdown = computeCategoryBreakdown(user.transactions, user.categories);
  const dirty = draft.nickname !== user.nickname || draft.notes !== user.notes || draft.isTest !== user.isTest;
  const weekPct = user.weekAllowance > 0 ? Math.min(1, user.thisWeekSpent / user.weekAllowance) : 0;

  async function run(fn, ok) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      await load();
      onChanged();
      if (ok) setMsg(ok);
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  }

  async function removeUser() {
    setBusy(true);
    setMsg("");
    try {
      await onDelete(hash);
      onBack();
    } catch (e) {
      setMsg(e.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="mb-3 text-sm font-semibold text-sapphire active:opacity-70">‹ Back</button>
      <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{displayName(user)}</h1>
      <code className="mt-1 block break-all font-mono text-[11px] text-gray-400">{user.hash}</code>
      <div className="mt-2 mb-4"><StatusBadge user={user} /></div>

      <section className={`${card} mb-4 space-y-3 p-5`}>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">Profile</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Nickname</label>
          <input value={draft.nickname} maxLength={60} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} placeholder="e.g. Grade 10 – Maria" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Notes (admin only)</label>
          <textarea value={draft.notes} maxLength={500} rows={3} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={field} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={draft.isTest} onChange={(e) => setDraft({ ...draft, isTest: e.target.checked })} className="h-4 w-4 accent-sapphire" />
          Test account (hide from stats)
        </label>
        <button
          disabled={!dirty || busy}
          onClick={() => run(() => saveUserMeta(hash, { nickname: draft.nickname.trim(), notes: draft.notes.trim(), isTest: draft.isTest }), "Saved.")}
          className={`w-full rounded-2xl py-3 text-sm font-semibold transition ${dirty && !busy ? "bg-sapphire text-white active:scale-[0.99]" : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800"}`}
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
        {msg && <p role="status" className="text-xs text-gray-500 dark:text-gray-400">{msg}</p>}
      </section>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="Joined" value={timeAgo(user.createdAt)} sub={fmtDateTime(user.createdAt)} />
        <Stat label="Last active" value={timeAgo(user.lastActivity)} />
        <Stat label="Transactions" value={user.txCount} sub={formatMoney(user.totalSpent, sym)} />
        <Stat label="Weekly allowance" value={formatMoney(user.weeklyAllowance, sym)} sub={`${user.spendDays} spend days`} />
        <Stat label="Streak" value={`${user.streakCurrent} wk`} sub={`best ${user.streakBest}`} />
        <Stat label="Over-budget weeks" value={`${user.overWeeks} / ${user.activeWeeks}`} sub={user.hasDreamGoal ? "has dream goal" : "no dream goal"} />
      </div>

      <section className={`${card} mb-4 p-5`}>
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-bold text-gray-900 dark:text-gray-50">This week</span>
          <span className="font-mono text-gray-600 dark:text-gray-300">{formatMoney(user.thisWeekSpent, sym)} / {formatMoney(user.weekAllowance, sym)}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="h-full rounded-full" style={{ width: `${Math.max(weekPct * 100, user.thisWeekSpent ? 3 : 0)}%`, backgroundColor: user.overBudgetNow ? "#EF4444" : "#5B8C5A" }} />
        </div>
      </section>

      <section className={`${card} mb-4 p-5`}>
        <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-50">Spending over time</h2>
        <div className="mb-4 flex gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/5">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setMode(r.key)} className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition ${mode === r.key ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}>
              {r.label}
            </button>
          ))}
        </div>
        <HistoryChart data={history} symbol={sym} />
      </section>

      <section className={`${card} mb-4 p-5`}>
        <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-50">Categories (all time)</h2>
        <CategoryBreakdown breakdown={breakdown} symbol={sym} />
      </section>

      <section className={`${card} mb-4 p-5`}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">Transactions</h2>
          <button disabled={!user.txCount} onClick={() => downloadCsv(`vaultie-${user.hash.slice(0, 8)}.csv`, txToCsv(user))} className={pillBtn}>↓ CSV</button>
        </div>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Tap one to edit or remove it. The student’s phone keeps its own copy and may overwrite admin edits the next time it saves.
        </p>
        {user.txCount === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
        ) : (
          <div className="max-h-[28rem] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {user.transactions.map((t) => (
              <button key={t.id} onClick={() => setEditing(t)} className="block w-full text-left active:opacity-70">
                <TxRow tx={t} symbol={sym} cat={user.categories.find((c) => c.id === t.categoryId)} />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={`${card} p-5`}>
        {confirmDel ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">Permanently delete this user and all their transactions? This can’t be undone.</p>
            <button disabled={busy} onClick={removeUser} className="w-full rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white active:scale-[0.99] disabled:opacity-60">
              {busy ? "Deleting…" : "Yes, delete user"}
            </button>
            <button disabled={busy} onClick={() => setConfirmDel(false)} className="w-full py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="w-full rounded-2xl bg-red-500/10 py-3 text-sm font-semibold text-red-500 active:scale-[0.99]">Delete user</button>
        )}
      </section>

      {editing && (
        <EditSheet
          key={editing.id}
          tx={editing}
          categories={user.categories}
          symbol={sym}
          onClose={() => setEditing(null)}
          onSave={(tx) => { setEditing(null); run(() => saveTransactions(hash, (list) => list.map((t) => (t.id === tx.id ? { ...t, ...tx } : t))), "Transaction updated."); }}
          onDelete={(tx) => { setEditing(null); run(() => saveTransactions(hash, (list) => list.filter((t) => t.id !== tx.id)), "Transaction removed."); }}
        />
      )}
    </div>
  );
}
