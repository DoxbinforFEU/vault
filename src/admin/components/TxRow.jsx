import { formatMoney } from "../../lib/budget.js";
import { fmtDateTime } from "../lib/userModel.js";

/** One transaction line. `cat` may be undefined (deleted category). */
export default function TxRow({ tx, cat, symbol, extra }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
        style={{ backgroundColor: (cat?.color || "#888888") + "22" }}
      >
        {cat?.icon || "💸"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
          {tx.note || cat?.name || "Expense"}
        </p>
        <p className="truncate text-xs text-gray-400">
          {extra ? `${extra} · ` : ""}
          {cat?.name || "Uncategorized"} · {fmtDateTime(tx.ts)}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
        -{formatMoney(tx.amount, symbol)}
      </span>
    </div>
  );
}
