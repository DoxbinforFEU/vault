import { useState } from "react";
import { formatMoney } from "../../lib/budget.js";
import { displayName, shortKey, timeAgo } from "../lib/userModel.js";
import { useUserList } from "../lib/useUserList.js";
import { activityToCsv, downloadCsv } from "../lib/csv.js";
import { SearchSortBar, FilterBar, Pager, StatusBadge, pillBtn } from "../components/UserListControls.jsx";
import TxRow from "../components/TxRow.jsx";

const card = "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm";
const PREVIEW = 3;

function UserActivity({ user, onOpen }) {
  const [open, setOpen] = useState(false);
  const rows = open ? user.transactions : user.transactions.slice(0, PREVIEW);
  const hidden = user.txCount - PREVIEW;

  return (
    <section className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => onOpen(user.hash)} className="min-w-0 text-left active:opacity-70">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50" title={user.hash}>{displayName(user)}</p>
          {user.nickname && <p className="truncate font-mono text-[11px] text-gray-400">{shortKey(user.hash)}</p>}
          <p className="mb-1 text-xs text-gray-400">Last active {timeAgo(user.lastActivity)}</p>
          <StatusBadge user={user} />
        </button>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">{formatMoney(user.totalSpent, user.symbol)}</p>
          <p className="text-xs text-gray-400">{user.txCount} transaction{user.txCount === 1 ? "" : "s"}</p>
        </div>
      </div>

      {user.txCount === 0 ? (
        <p className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">No activity yet.</p>
      ) : (
        <>
          <div className={`mt-2 divide-y divide-gray-100 dark:divide-gray-800 ${open ? "max-h-80 overflow-y-auto" : ""}`}>
            {rows.map((t) => (
              <TxRow key={t.id} tx={t} symbol={user.symbol} cat={user.categories.find((c) => c.id === t.categoryId)} />
            ))}
          </div>
          {hidden > 0 && (
            <button onClick={() => setOpen((o) => !o)} className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-sapphire active:opacity-70">
              {open ? "Show less" : `Show all ${user.txCount}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** Every user's activity: 10 users per page, with search, sort, status and date-range filters. */
export default function Activity({ users, onOpen }) {
  const list = useUserList(users);
  const txTotal = list.all.reduce((n, u) => n + u.txCount, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">User activity</h1>
        <button disabled={txTotal === 0} onClick={() => downloadCsv("vaultie-activity.csv", activityToCsv(list.all))} className={pillBtn}>
          ↓ Export CSV
        </button>
      </div>
      <SearchSortBar list={list} />
      <FilterBar list={list} showRange />
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        {list.total} user{list.total === 1 ? "" : "s"} · {txTotal} transaction{txTotal === 1 ? "" : "s"} in this view
      </p>
      {list.items.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-gray-500 dark:text-gray-400`}>
          {list.query ? `No users match “${list.query}”.` : "No users match these filters."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.items.map((u) => (
            <UserActivity key={u.hash} user={u} onOpen={onOpen} />
          ))}
        </div>
      )}
      <Pager list={list} />
    </div>
  );
}
