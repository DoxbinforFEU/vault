// Supabase I/O for the admin dashboard. Pure logic lives in userModel.js.
import { supabase } from "../../lib/supabase.js";
import { summarize } from "./userModel.js";

const BATCH = 500;
const META = "hash,nickname,notes,is_test,created_at,updated_at";
// Lean: pull only what the lists need out of the JSON (skips the dream-goal image).
const LEAN =
  META +
  ",transactions:data->transactions,categories:data->categories,overrides:data->weekOverrides" +
  ",allowance:data->settings->weeklyAllowance,weekStart:data->settings->weekStartDay" +
  ",spendDays:data->settings->spendDaysPerWeek,symbol:data->settings->>currencySymbol" +
  ",goal:data->settings->dreamGoal->>name";
const FULL = META + ",data";

const need = () => {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

function friendly(error) {
  const m = error.message || String(error);
  if (/nickname|is_test|notes/.test(m)) return new Error("Database is missing the new admin columns. Re-run supabase/schema.sql in the SQL Editor.");
  return new Error(m);
}

async function fetchAll(select) {
  const db = need();
  const out = [];
  for (let from = 0; ; from += BATCH) {
    const { data, error } = await db
      .from("budgets")
      .select(select)
      .order("created_at", { ascending: false })
      .order("hash")
      .range(from, from + BATCH - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < BATCH) break;
  }
  return out;
}

/** Every user, loaded in batches of 500 (no 1,000-row cap). Falls back to full rows if the lean select is rejected. */
export async function fetchUsers() {
  let rows;
  try {
    rows = await fetchAll(LEAN);
  } catch (e) {
    if (/nickname|is_test|notes/.test(e.message || "")) throw friendly(e);
    try {
      rows = await fetchAll(FULL);
    } catch (e2) {
      throw friendly(e2);
    }
  }
  const now = Date.now();
  return rows.map((r) => summarize(r, now));
}

/** One user with the complete data blob (used by the detail page and for edits). */
export async function fetchUserFull(hash) {
  const { data, error } = await need().from("budgets").select(FULL).eq("hash", hash).maybeSingle();
  if (error) throw friendly(error);
  if (!data) throw new Error("This user no longer exists.");
  return data;
}

export async function saveUserMeta(hash, { nickname, notes, isTest }) {
  const { error } = await need()
    .from("budgets")
    .update({ nickname: nickname || null, notes: notes || null, is_test: Boolean(isTest) })
    .eq("hash", hash);
  if (error) throw friendly(error);
}

export async function setTestFlag(hashes, flag) {
  const { error } = await need().from("budgets").update({ is_test: flag }).in("hash", hashes);
  if (error) throw friendly(error);
}

/**
 * Edit a user's transactions: re-reads the latest blob, applies `fn(transactions)`, writes it back.
 * NOTE: the student's device keeps its own copy and may overwrite this on its next save.
 */
export async function saveTransactions(hash, fn) {
  const db = need();
  const { data: row, error } = await db.from("budgets").select("data").eq("hash", hash).single();
  if (error) throw friendly(error);
  const cur = row.data || {};
  const next = { ...cur, transactions: fn(Array.isArray(cur.transactions) ? cur.transactions : []), updatedAt: Date.now() };
  const { error: e2 } = await db.from("budgets").update({ data: next, updated_at: new Date().toISOString() }).eq("hash", hash);
  if (e2) throw friendly(e2);
}

export async function deleteUsers(hashes) {
  if (!hashes.length) return;
  const { error } = await need().from("budgets").delete().in("hash", hashes);
  if (error) throw friendly(error);
}
