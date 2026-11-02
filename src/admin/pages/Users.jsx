import { useEffect, useState } from "react";
import { formatMoney } from "../../lib/budget.js";
import Modal from "../../components/Modal.jsx";
import { displayName, shortKey, timeAgo } from "../lib/userModel.js";
import { useUserList } from "../lib/useUserList.js";
import { usersToCsv, downloadCsv } from "../lib/csv.js";
import { SearchSortBar, FilterBar, Pager, StatusBadge, pillBtn } from "../components/UserListControls.jsx";

const card = "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm";

function ConfirmDelete({ count, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function go() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal title={`Delete ${count} user${count === 1 ? "" : "s"}?`} onClose={busy ? () => {} : onClose}>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        This permanently deletes the selected account{count === 1 ? "" : "s"} and all transactions. It can’t be undone. (A student’s phone may re-create its account the next time it saves.)
      </p>
      {error && <p role="alert" className="mb-2 text-xs text-red-500">{error}</p>}
      <div className="space-y-2">
        <button onClick={go} disabled={busy} className="w-full rounded-2xl bg-red-500 py-3.5 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-60">
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
        <button onClick={onClose} disabled={busy} className="w-full rounded-2xl py-3 text-base font-medium text-gray-500 dark:text-gray-400">Cancel</button>
      </div>
    </Modal>
  );
}

/** User directory: search / sort / filter, 10 per page, multi-select bulk actions, tap a row for details. */
export default function Users({ users, onOpen, onDeleteMany, onMarkTest }) {
  const list = useUserList(users, { sortKey: "createdAt" });
  const [sel, setSel] = useState(() => new Set());
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState("");

  // Drop selections for users that no longer exist (deleted / filtered out of the data set).
  useEffect(() => {
    setSel((prev) => {
      const live = new Set(users.map((u) => u.hash));
      const next = new Set([...prev].filter((h) => live.has(h)));
      return next.size === prev.size ? prev : next;
    });
  }, [users]);

  const picked = users.filter((u) => sel.has(u.hash));
  const pageAllSelected = list.items.length > 0 && list.items.every((u) => sel.has(u.hash));
  const toggle = (h) => setSel((p) => { const n = new Set(p); n.has(h) ? n.delete(h) : n.add(h); return n; });
  const togglePage = () =>
    setSel((p) => { const n = new Set(p); list.items.forEach((u) => (pageAllSelected ? n.delete(u.hash) : n.add(u.hash))); return n; });

  const allTest = picked.length > 0 && picked.every((u) => u.isTest);
  async function mark() {
    setErr("");
    try {
      await onMarkTest(picked.map((u) => u.hash), !allTest);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Users</h1>
        <button
          disabled={(picked.length ? picked : list.all).length === 0}
          onClick={() => downloadCsv("vaultie-users.csv", usersToCsv(picked.length ? picked : list.all))}
          className={pillBtn}
        >
          ↓ Export {picked.length ? `${picked.length} selected` : `${list.total} CSV`}
        </button>
      </div>
      <SearchSortBar list={list} />
      <FilterBar list={list} />

      {picked.length > 0 && (
        <div className="sticky top-2 z-10 mb-3 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <span className="flex-1 text-xs font-semibold text-gray-700 dark:text-gray-200">{picked.length} selected</span>
          <button onClick={mark} className={pillBtn}>{allTest ? "Unmark test" : "Mark test"}</button>
          <button onClick={() => setConfirm(true)} className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 active:scale-95">Delete</button>
          <button onClick={() => setSel(new Set())} aria-label="Clear selection" className="px-1 text-gray-400">✕</button>
        </div>
      )}
      {err && <p role="alert" className="mb-2 text-xs text-red-500">{err}</p>}

      {list.items.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-gray-500 dark:text-gray-400`}>
          {list.query ? `No users match “${list.query}”.` : "No users match these filters."}
        </div>
      ) : (
        <div className={`${card} overflow-hidden`}>
          <label className="flex items-center gap-3 border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <input type="checkbox" checked={pageAllSelected} onChange={togglePage} className="h-4 w-4 accent-sapphire" />
            Select this page
          </label>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {list.items.map((u) => (
              <div key={u.hash} className="flex items-center gap-3 px-4 py-3">
                <input type="checkbox" checked={sel.has(u.hash)} onChange={() => toggle(u.hash)} aria-label={`Select ${displayName(u)}`} className="h-4 w-4 shrink-0 accent-sapphire" />
                <button onClick={() => onOpen(u.hash)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{displayName(u)}</p>
                    <p className="truncate text-xs text-gray-400">
                      {u.nickname ? `${shortKey(u.hash)} · ` : ""}Joined {timeAgo(u.createdAt)} · {u.txCount} tx
                    </p>
                    <div className="mt-1"><StatusBadge user={u} /></div>
                  </div>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-gray-600 dark:text-gray-300">{formatMoney(u.totalSpent, u.symbol)}</span>
                  <span className="text-gray-300 dark:text-gray-600">›</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <Pager list={list} />
      {confirm && <ConfirmDelete count={picked.length} onClose={() => setConfirm(false)} onConfirm={() => onDeleteMany(picked.map((u) => u.hash))} />}
    </div>
  );
}
