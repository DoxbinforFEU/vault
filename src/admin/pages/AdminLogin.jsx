import { useState } from "react";
import { supabase } from "../../lib/supabase.js";

/** Separate admin sign-in (Supabase email + password). Not linked from the student app. */
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim() && password && !busy;

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.message);
    setBusy(false); // on success AdminApp swaps this screen out via onAuthStateChange
  }

  const field =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sapphire/40 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sapphire text-3xl font-bold text-white shadow-sm">
            ₱
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            vault<span className="text-sapphire">ie</span>{" "}
            <span className="align-middle rounded-full bg-sapphire/10 px-2 py-0.5 text-xs font-semibold text-sapphire">
              admin
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to the admin dashboard.</p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
          <input
            autoFocus
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
          <label className="mb-1 mt-3 block text-sm font-medium text-gray-600 dark:text-gray-300">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          {error && (
            <p role="alert" className="mt-3 text-xs text-red-500">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`mt-4 w-full rounded-2xl py-3.5 text-base font-semibold transition ${
              canSubmit
                ? "bg-sapphire text-white active:scale-[0.99]"
                : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800"
            }`}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
