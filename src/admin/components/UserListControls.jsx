import { SORTS, STATUSES, RANGES, statusOf } from "../lib/userModel.js";

const input =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-sapphire/40";

/** Search box + sort dropdown + asc/desc toggle. `list` comes from useUserList. */
export function SearchSortBar({ list, placeholder = "Search key, name or notes" }) {
  return (
    <div className="mb-2 space-y-2">
      <input
        type="search"
        value={list.query}
        onChange={(e) => list.setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search users"
        className={`${input} w-full`}
      />
      <div className="flex gap-2">
        <select value={list.sortKey} onChange={(e) => list.setSortKey(e.target.value)} aria-label="Sort by" className={`${input} min-w-0 flex-1`}>
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>Sort: {s.label}</option>
          ))}
        </select>
        <button onClick={list.toggleDir} aria-label={list.dir === "asc" ? "Ascending" : "Descending"} className={`${input} w-24 font-semibold active:scale-95`}>
          {list.dir === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>
    </div>
  );
}

/** Status filter, plus a date-range filter when `showRange`. */
export function FilterBar({ list, showRange = false }) {
  const setCustom = (patch) => list.setRange({ ...list.range, key: "custom", ...patch });
  return (
    <div className="mb-4 space-y-2">
      <div className="flex gap-2">
        <select value={list.status} onChange={(e) => list.setStatus(e.target.value)} aria-label="Filter by status" className={`${input} min-w-0 flex-1`}>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        {showRange && (
          <select
            value={list.range.key}
            onChange={(e) => list.setRange({ ...list.range, key: e.target.value })}
            aria-label="Date range"
            className={`${input} min-w-0 flex-1`}
          >
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        )}
      </div>
      {showRange && list.range.key === "custom" && (
        <div className="flex items-center gap-2">
          <input type="date" value={list.range.from} max={list.range.to || undefined} onChange={(e) => setCustom({ from: e.target.value })} aria-label="From date" className={`${input} min-w-0 flex-1`} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={list.range.to} min={list.range.from || undefined} onChange={(e) => setCustom({ to: e.target.value })} aria-label="To date" className={`${input} min-w-0 flex-1`} />
        </div>
      )}
    </div>
  );
}

/** ‹ Page x of y › with a "showing a–b of n" caption. */
export function Pager({ list }) {
  const arrow =
    "flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold text-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200";
  return (
    <div className="mt-4 flex items-center justify-between">
      <button onClick={list.prev} disabled={list.page === 0} aria-label="Previous page" className={arrow}>‹</button>
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        <div className="font-semibold text-gray-900 dark:text-gray-50">Page {list.page + 1} of {list.pages}</div>
        {list.total ? `Showing ${list.from}–${list.to} of ${list.total}` : "No users"}
      </div>
      <button onClick={list.next} disabled={list.page >= list.pages - 1} aria-label="Next page" className={arrow}>›</button>
    </div>
  );
}

const STATUS_STYLE = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  quiet: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
  inactive: "bg-amber-400/10 text-amber-600 dark:text-amber-400",
  never: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
};
const STATUS_LABEL = { active: "Active", quiet: "Quiet", inactive: "Inactive", never: "Never logged" };

export function StatusBadge({ user }) {
  const s = statusOf(user);
  const pill = "rounded-full px-2 py-0.5 text-[10px] font-semibold";
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className={`${pill} ${STATUS_STYLE[s]}`}>{STATUS_LABEL[s]}</span>
      {user.overBudgetNow && <span className={`${pill} bg-red-500/10 text-red-500`}>Over budget</span>}
      {user.isTest && <span className={`${pill} bg-sapphire/10 text-sapphire`}>Test</span>}
    </span>
  );
}

/** Small pill button used for Export / action rows. */
export const pillBtn =
  "rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 active:scale-95 disabled:opacity-50 dark:bg-white/5 dark:text-gray-200";
