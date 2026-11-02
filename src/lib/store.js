const HASH_KEY = "budget.hash";
const STORAGE_PREFIX = "budget.data.";
// Keep the local storage well under the ~5 MB localStorage budget.
const MAX_STORAGE_CHARS = 4_000_000;

/** Generate a 128-bit random account hash (32 hex chars). Acts as the credential. */
export function genHash() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getStoredHash() {
  try {
    return localStorage.getItem(HASH_KEY);
  } catch {
    return null;
  }
}

export function storeHash(hash) {
  try {
    localStorage.setItem(HASH_KEY, hash);
  } catch {
    /* private mode */
  }
}

// Supabase is loaded lazily so it stays out of the main bundle and the app
// still works (local-only) when it isn't configured or the device is offline.
async function getRemote() {
  try {
    const { supabase } = await import("./supabase.js");
    return supabase;
  } catch {
    return null;
  }
}

async function pullRemote(hash) {
  try {
    const db = await getRemote();
    if (!db) return null;
    const { data, error } = await db.from("budgets").select("data").eq("hash", hash).maybeSingle();
    if (error) return null;
    return data?.data ?? null;
  } catch {
    return null;
  }
}

async function pushRemote(hash, blob) {
  try {
    const db = await getRemote();
    if (!db) return;
    const { error } = await db
      .from("budgets")
      .upsert({ hash, data: blob, updated_at: new Date().toISOString() }, { onConflict: "hash" });
    if (error) console.warn("Supabase sync failed:", error.message);
  } catch {
    /* offline — local copy is still saved */
  }
}

/**
 * Load a user's budget blob by hash. Local copy first (instant/offline); if this
 * device has none (e.g. signing in with a key on a new phone) fall back to
 * Supabase. Returns the JSON object or null if the key is unknown.
 */
export async function loadBudget(hash) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + hash);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to remote */
  }
  const remote = await pullRemote(hash);
  if (remote) {
    try {
      localStorage.setItem(STORAGE_PREFIX + hash, JSON.stringify(remote));
    } catch {
      /* quota — still usable this session */
    }
  }
  return remote;
}

/** Save locally, then mirror to Supabase (best effort) so admins can see activity. */
export async function saveBudget(hash, blob) {
  saveLocal(hash, blob);
  await pushRemote(hash, blob);
}

function saveLocal(hash, blob) {
  try {
    let payload = blob;
    let str = JSON.stringify(payload);
    if (str.length > MAX_STORAGE_CHARS && Array.isArray(blob.transactions)) {
      const txs = [...blob.transactions].sort((a, b) => b.ts - a.ts); // newest first
      let keep = txs.length;
      while (str.length > MAX_STORAGE_CHARS && keep > 50) {
        keep = Math.floor(keep * 0.8);
        payload = { ...blob, transactions: txs.slice(0, keep) };
        str = JSON.stringify(payload);
      }
    }
    localStorage.setItem(STORAGE_PREFIX + hash, str);
  } catch {
    // Quota exceeded or private mode — fall back to a hard-trimmed copy
    try {
      const txs = Array.isArray(blob.transactions)
        ? [...blob.transactions].sort((a, b) => b.ts - a.ts).slice(0, 500)
        : [];
      localStorage.setItem(
        STORAGE_PREFIX + hash,
        JSON.stringify({ ...blob, transactions: txs })
      );
    } catch {
      /* ignore */
    }
  }
}

export function clearBudget(hash) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + hash);
  } catch {
    /* ignore */
  }
}
