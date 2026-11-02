import { useState } from "react";
import { parseAmount, formatMoney, formatTime } from "../lib/budget.js";

const DANGER = "#EF4444";

/**
 * Bottom-sheet editor for a tapped transaction. Edits the amount, category, and
 * note in place (keeping the original id + timestamp) and saves via onSave, or
 * removes it via onDelete. Mounted only while a transaction is selected, with a
 * key on the id so the form state resets for each one.
 */
export default function EditSheet({ tx, categories = [], symbol, onClose, onSave, onDelete }) {
  const [amountStr, setAmountStr] = useState((tx.amount / 100).toString());
  const [categoryId, setCategoryId] = useState(tx.categoryId);
  const [note, setNote] = useState(tx.note || "");

  const cents = parseAmount(amountStr);
  const canSave = cents > 0 && categoryId != null;

  function save() {
    if (!canSave) return;
    onSave({ ...tx, amount: cents, categoryId, note: note.trim() });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md animate-[slideUp_200ms_ease-out] rounded-t-3xl border border-gray-200 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />

        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">Edit transaction</h3>
          <span className="text-xs text-gray-400">{formatTime(tx.ts)}</span>
        </div>

        {/* Amount */}
        <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-400">
          Amount
        </label>
        <div className="mt-1 flex items-center rounded-2xl bg-gray-100 px-4 dark:bg-gray-950">
          <span className="text-2xl font-bold text-gray-400">{symbol}</span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full bg-transparent px-2 py-3 text-right text-3xl font-extrabold tabular-nums text-gray-900 focus:outline-none dark:text-gray-50"
          />
        </div>

        {/* Category chips */}
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-gray-400">
          Category
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`min-h-[40px] rounded-full px-3.5 py-2 text-sm font-medium transition active:scale-95 ${
                  active
                    ? "border border-transparent text-white"
                    : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200"
                }`}
                style={active ? { backgroundColor: c.color } : undefined}
              >
                {c.icon} {c.name}
              </button>
            );
          })}
        </div>

        {/* Note */}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note"
          className="mt-4 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sapphire/40 dark:bg-gray-950 dark:text-gray-50"
        />

        <div className="mt-5 space-y-3">
          <button
            onClick={save}
            disabled={!canSave}
            className={`w-full rounded-2xl py-3.5 text-base font-semibold transition ${
              canSave
                ? "bg-sapphire text-white active:scale-[0.99]"
                : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800"
            }`}
          >
            {canSave ? `Save ${formatMoney(cents, symbol)}` : "Enter amount & category"}
          </button>
          <button
            onClick={() => onDelete(tx)}
            className="w-full rounded-2xl py-3.5 text-base font-semibold transition active:scale-[0.99]"
            style={{ backgroundColor: DANGER + "1a", color: DANGER }}
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-2xl py-3 text-base font-medium text-gray-500 dark:text-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}
