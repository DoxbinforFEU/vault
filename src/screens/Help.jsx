import { useState } from "react";

const card =
  "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm";

function Chevron({ open }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Collapsible help topic. Closed by default to keep the page calm. */
function Topic({ id, title, hint, openId, setOpenId, children }) {
  const open = openId === id;
  return (
    <div className={`${card} overflow-hidden`}>
      <button
        onClick={() => setOpenId(open ? null : id)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left active:bg-gray-50 dark:active:bg-gray-800/40"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-gray-900 dark:text-gray-50">{title}</span>
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {children}
        </div>
      )}
    </div>
  );
}

/** A term + its plain-language meaning, used in the glossary. */
function Term({ name, children }) {
  return (
    <p>
      <span className="font-semibold text-gray-900 dark:text-gray-50">{name}</span> — {children}
    </p>
  );
}

/**
 * Help / FAQ — explains every feature: logging, editing/deleting, the global
 * vs per-week settings, the dashboard glossary, and how the numbers are
 * calculated. One topic open at a time so it never feels like a wall of text.
 */
export default function Help() {
  const [openId, setOpenId] = useState(null);
  const props = { openId, setOpenId };

  return (
    <div className="min-h-full space-y-3 bg-gray-50 px-4 pt-5 pb-4 dark:bg-gray-950">
      <header className="mb-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Help</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Everything vaultie can do. Tap a topic to open it.
        </p>
      </header>

      <Topic id="log" title="Logging an expense" hint="The home screen, built for speed" {...props}>
        <p>
          vaultie opens straight to the keypad. Type an amount, tap a category, add an optional note,
          then <b>Save</b>. The entry lands in <b>This Week</b> instantly.
        </p>
        <p>Tap the chart shortcut at the top, or the Dashboard tab, anytime to see where you stand.</p>
      </Topic>

      <Topic id="edit" title="Editing or deleting an entry" hint="Fix a mistake or remove a spend" {...props}>
        <p>
          Open the <b>History</b> tab and tap any entry. The sheet that slides up lets you change the
          amount, category, or note — tap <b>Save</b> to update that same entry (it keeps its
          original date and time).
        </p>
        <p>
          To remove it, tap <b>Delete</b>. Either way, your totals and charts update right away.
        </p>
      </Topic>

      <Topic
        id="budget"
        title="Budget & spend days"
        hint="Your defaults, and changing just one week"
        {...props}
      >
        <p>Two settings drive all the math:</p>
        <p>
          <b>Weekly allowance</b> — your normal weekly budget.
        </p>
        <p>
          <b>Spend days per week</b> — how many days you actually spend (e.g. 5 school days). Your
          daily limit splits your budget across these days, not all 7.
        </p>
        <p>
          Set your <b>defaults</b> in <b>Settings</b>. To change just one week without touching your
          defaults, use the <b>Dashboard</b>: <b>Adjust</b> (above the ring) overrides that week's
          budget, and the <b>Spend days</b> tile's <b>Edit</b> overrides that week's spend days.
        </p>
        <p>
          Adjusted weeks show a small “adjusted / this week” tag, and everything returns to your
          defaults the following week.
        </p>
      </Topic>

      <Topic id="terms" title="Dashboard terms, explained" hint="What each number means" {...props}>
        <Term name="This Week · Resets [day]">your current budget week; it restarts on the day you choose.</Term>
        <Term name="Budget">the allowance for this week (shows “adjusted” if you overrode it).</Term>
        <Term name="Left / over budget">what's remaining — the big number in the ring.</Term>
        <Term name="Daily limit">how much you can spend per remaining spend day and still stay on budget.</Term>
        <Term name="spend days left">spend days still remaining this week.</Term>
        <Term name="Today">the total you've logged so far today.</Term>
        <Term name="pace (under / over)">whether you're ahead of or behind an even spending rate for how far into the week you are.</Term>
        <Term name="Spent this week">total logged, with % of budget and the change vs last week.</Term>
        <Term name="Spend days">your spend-days setting for this week (tap Edit to change only this week).</Term>
        <Term name="Projected end">your estimated total by week's end at your current pace, and whether that lands over or under budget.</Term>
        <Term name="Avg / spend day">average spent per spend day so far this week.</Term>
        <Term name="This month">total across all weeks in the current calendar month.</Term>
        <Term name="No-spend days">days this week where you logged nothing.</Term>
        <Term name="Saved so far">total left over from past finished weeks where you came in under budget.</Term>
        <Term name="Biggest spend">your largest single entry this week.</Term>
        <Term name="🔥 streak">consecutive finished weeks you stayed within budget (“best” is your record).</Term>
        <Term name="Expense by Category">where this week's money went, with a trend vs your 4-week average.</Term>
        <Term name="Spend by day">your average spend for each weekday, over the weeks you've been using vaultie.</Term>
      </Topic>

      <Topic id="math" title="How the numbers are calculated" hint="For the curious" {...props}>
        <Term name="Daily limit">money left ÷ spend days left — so it adapts as the week goes on.</Term>
        <Term name="Projected end">what you've spent ÷ spend days used so far × your total spend days.</Term>
        <Term name="Pace">what you'd expect to have spent by now (budget spread evenly across spend days) minus what you actually spent. Positive means under pace.</Term>
        <Term name="Streak">counts finished weeks where total spend ≤ that week's budget; the current week doesn't count until it ends.</Term>
        <p className="pt-1 text-gray-500 dark:text-gray-400">
          Everything is tracked to the centavo and only rounded when shown.
        </p>
      </Topic>

      <Topic id="privacy" title="Your money & data" hint="What we can see, and how it's kept safe" {...props}>
        <p>
          <b>vaultie can't touch your money.</b> It isn't linked to any bank, card, or e-wallet —
          every amount is something you type in yourself. There's no account to move money out of,
          so even we can't.
        </p>
        <p>
          <b>We don't know who you are.</b> No name, email, or password — your account is just a
          random private key stored on your device. We don't collect contact details or sell your
          data, and there are no ads or cross-app tracking.
        </p>
        <p>
          <b>How it's stored.</b> Your connection is encrypted in transit (HTTPS/TLS) between your
          phone and the database, and the data sits on a managed database that encrypts it at rest.
          Entries can only be read or written by a request carrying your key.
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          To be straight with you: your data isn't end-to-end encrypted, so treat vaultie as a
          personal spending log rather than a vault. Your key is what protects it — keep it private,
          and remember there's no password reset.
        </p>
      </Topic>

      <Topic id="account" title="Account, sync & offline" hint="Your key, the cloud, and going offline" {...props}>
        <p>
          There's no email or password — your account is a private <b>key</b> (Settings → Your
          account key). Copy it to sign in on another device. Anyone with the key can open your data
          and there's no password reset, so keep it somewhere safe.
        </p>
        <p>
          Your data lives in the cloud and is cached on your device, so vaultie opens instantly and
          works offline. Anything you log offline is saved on your device and syncs automatically the
          moment you're back online.
        </p>
        <p>
          If a new version is out and you still see the old one, use <b>Settings → Check for
          updates</b>. On iPhone, add vaultie to your Home Screen so it reliably keeps your offline
          data.
        </p>
      </Topic>

      <p className="px-1 pt-2 text-center text-xs text-gray-400">vaultie — make it to Friday 🌱</p>
    </div>
  );
}
