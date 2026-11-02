import { formatMoney } from "../lib/budget.js";

/**
 * Pill-shaped category spend bars: a rounded emoji chip floats on the left,
 * the amount + percentage align right, and a rounded-full progress bar fills
 * beneath each row. Renders the list only — the card chrome lives in Dashboard.
 */
export default function CategoryBreakdown({ breakdown, symbol }) {
  const { rows } = breakdown;
  if (!rows.length) {
    return (
      <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        No spending logged this week yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.categoryId} className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
            style={{ backgroundColor: r.color + "22" }}
          >
            {r.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {r.name}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatMoney(r.amount, symbol)}
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  {Math.round(r.pct * 100)}%
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(r.pct * 100, 5)}%`,
                  backgroundColor: r.color,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
