import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase.js";
import { fetchUsers, deleteUsers, setTestFlag } from "./lib/adminData.js";
import { timeAgo } from "./lib/userModel.js";
import AdminLogin from "./pages/AdminLogin.jsx";
import Overview from "./pages/Overview.jsx";
import Activity from "./pages/Activity.jsx";
import Users from "./pages/Users.jsx";
import UserDetail from "./pages/UserDetail.jsx";
import AdminNav from "./components/AdminNav.jsx";
import { pillBtn } from "./components/UserListControls.jsx";

const Centered = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center dark:bg-gray-950">{children}</div>
);
const Spinner = () => <div className="h-8 w-8 animate-spin rounded-full border-2 border-sapphire border-t-transparent" />;

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [view, setView] = useState("overview");
  const [selected, setSelected] = useState(null); // hash of the user whose detail page is open
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const [, tick] = useState(0);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // `silent` refreshes in the background (no spinner, keeps old data if it fails).
  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      setUsers(await fetchUsers());
      setLastSynced(Date.now());
      setError("");
      setStatus("ready");
    } catch (e) {
      setError(e.message);
      if (!silent) setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  // Live updates when students save (needs the realtime line in schema.sql), debounced.
  useEffect(() => {
    if (!session || !supabase) return;
    let t;
    const ch = supabase
      .channel("admin-budgets")
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => {
        clearTimeout(t);
        t = setTimeout(() => load(true), 3000);
      })
      .subscribe();
    return () => {
      clearTimeout(t);
      supabase.removeChannel(ch);
    };
  }, [session, load]);

  // Offline banner + keep the "synced x ago" label fresh.
  useEffect(() => {
    const on = () => { setOnline(true); load(true); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      clearInterval(id);
    };
  }, [load]);

  async function removeUsers(hashes) {
    await deleteUsers(hashes);
    setUsers((prev) => prev.filter((u) => !hashes.includes(u.hash)));
  }
  async function markTest(hashes, flag) {
    await setTestFlag(hashes, flag);
    setUsers((prev) => prev.map((u) => (hashes.includes(u.hash) ? { ...u, isTest: flag } : u)));
  }

  if (!supabaseConfigured) {
    return (
      <Centered>
        <div className="max-w-sm space-y-2">
          <p className="font-semibold text-gray-900 dark:text-gray-50">Supabase isn’t configured.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> and restart.
          </p>
        </div>
      </Centered>
    );
  }
  if (session === undefined) return <Centered><Spinner /></Centered>;
  if (!session) return <AdminLogin />;

  const visible = showTest ? users : users.filter((u) => !u.isTest);
  const hiddenTests = users.length - visible.length;
  const open = (hash) => { setSelected(hash); window.scrollTo(0, 0); };
  const hideWhenDetail = (key) => (view === key && !selected ? "" : "hidden");

  return (
    <div className="min-h-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-5">
        <header className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold">vault<span className="text-sapphire">ie</span> admin</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => load()} disabled={status === "loading"} className={pillBtn}>
              {status === "loading" ? "Loading…" : "Refresh"}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 active:scale-95">Sign out</button>
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
          <span>{lastSynced ? `Synced ${timeAgo(lastSynced)}` : "Not synced yet"}</span>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={showTest} onChange={(e) => setShowTest(e.target.checked)} className="h-3.5 w-3.5 accent-sapphire" />
            Show test accounts{hiddenTests > 0 && !showTest ? ` (${hiddenTests} hidden)` : ""}
          </label>
        </div>

        {!online && (
          <div role="status" className="mb-4 rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            You’re offline — showing the last data loaded.
          </div>
        )}
        {error && status !== "loading" && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
            <span className="min-w-0">Couldn’t load users: {error}</span>
            <button onClick={() => load()} className="shrink-0 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold">Retry</button>
          </div>
        )}

        {status === "loading" && users.length === 0 ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : status === "error" && users.length === 0 ? null : (
          <>
            {selected && <UserDetail key={selected} hash={selected} onBack={() => setSelected(null)} onChanged={() => load(true)} onDelete={removeUsers} />}
            {/* Kept mounted (just hidden) so search / filters / page survive a trip to a user's detail page. */}
            <div className={hideWhenDetail("overview")}><Overview users={visible} onOpen={open} /></div>
            <div className={hideWhenDetail("activity")}><Activity users={visible} onOpen={open} /></div>
            <div className={hideWhenDetail("users")}><Users users={visible} onOpen={open} onDeleteMany={removeUsers} onMarkTest={markTest} /></div>
          </>
        )}
      </div>
      <AdminNav view={view} onChange={(v) => { setSelected(null); setView(v); }} />
    </div>
  );
}
