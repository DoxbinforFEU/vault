import { useMemo } from "react";
import { formatMoney } from "../../lib/budget.js";
import { displayName, timeAgo } from "../lib/userModel.js";
import { newUsersPerWeek, transactionsPerDay, spendByCategoryPerWeek, overviewStats } from "../lib/analytics.js";
import BarChart from "../components/BarChart.jsx";
import TxRow from "../components/TxRow.jsx";

const card = "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm";

function Tile({ label, value, sub }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

const Section = ({ title, hint, children }) => (
  <section className={`${card} mb-4 p-5`}>
    <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">{title}</h2>
    {hint && <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    {!hint && <div className="mb-3" />}
    {children}
  </section>
);

const Empty = ({ children }) => <p className="py-3 text-center text-sm text-gray-500 dark:text-gray-400">{children}</p>;

function UserLink({ user, onOpen, right, sub }) {
  return (
    <button onClick={() => onOpen(user.hash)} className="flex w-full items-center gap-3 py-2 text-left active:opacity-70">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{displayName(user)}</p>
        {sub && <p className="truncate text-xs text-gray-400">{sub}</p>}
      </div>
      {right && <span className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">{right}</span>}
      <span className="text-gray-300 dark:text-gray-600">›</span>
    </button>
  );
}

export default function Overview({ users, onOpen }) {
  const now = Date.now();
  const symbol = users[0]?.symbol || "₱";
  const s = useMemo(() => overviewStats(users, now), [users]); // eslint-disable-line react-hooks/exhaustive-deps
  const newUsers = useMemo(() => newUsersPerWeek(users, now), [users]); // eslint-disable-line react-hooks/exhaustive-deps
  const perDay = useMemo(() => transactionsPerDay(users, now), [users]); // eslint-disable-line react-hooks/exhaustive-deps
  const spend = useMemo(() => spendByCategoryPerWeek(users, now), [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const txTotal = users.reduce((n, u) => n + u.txCount, 0);
  const spentTotal = users.reduce((n, u) => n + u.totalSpent, 0);
  const new7 = newUsers[newUsers.length - 1].segments[0].value;
  const never = users.filter((u) => u.txCount === 0).length;

  const byCat = new Map();
  users.forEach((u) =>
    u.transactions.forEach((t) => {
      const c = u.categories.find((x) => x.id === t.categoryId);
      const key = c?.name || "Uncategorized";
      const row = byCat.get(key) || { name: key, icon: c?.icon || "❔", color: c?.color || "#888888", amount: 0 };
      row.amount += t.amount;
      byCat.set(key, row);
    })
  );
  const cats = [...byCat.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const maxCat = cats[0]?.amount || 1;

  const recent = users
    .flatMap((u) => u.transactions.slice(0, 5).map((t) => ({ t, u })))
    .sort((a, b) => b.t.ts - a.t.ts)
    .slice(0, 8);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Overview</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Tile label="Total users" value={users.length} sub={`${new7} new this week`} />
        <Tile label="Active (7 days)" value={s.active7} sub={`${never} never logged`} />
        <Tile label="Transactions" value={txTotal.toLocaleString("en-US")} sub="all time" />
        <Tile label="Total tracked" value={formatMoney(spentTotal, symbol)} sub={`${formatMoney(users.length ? Math.round(spentTotal / users.length) : 0, symbol)} / user`} />
        <Tile label="Weekly retention" value={s.retention == null ? "—" : `${s.retention}%`} sub="active last wk & this wk" />
        <Tile label="Avg streak" value={`${s.avgStreak} wk`} sub="under-budget weeks" />
        <Tile label="Typical allowance" value={formatMoney(s.medianAllowance, symbol)} sub="median / week" />
        <Tile label="Over budget now" value={s.overNow.length} sub="this week" />
      </div>

      <Alerts s={s} symbol={symbol} onOpen={onOpen} />

      <Section title="New users per week" hint="Last 8 weeks">
        <BarChart bars={newUsers} />
      </Section>
      <Section title="Transactions per day" hint="Last 14 days, all users">
        <BarChart bars={perDay} />
      </Section>
      <Section title="Spending by category per week" hint="Last 8 weeks, top 4 categories">
        <BarChart bars={spend.bars} legend={spend.legend} money symbol={symbol} />
      </Section>

      <Section title="Budget health" hint="Completed weeks with activity">
        {s.pctWeeksOver == null ? (
          <Empty>Not enough finished weeks yet.</Empty>
        ) : (
          <>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-bold text-gray-900 dark:text-gray-50">{s.pctWeeksOver}%</span> of user-weeks ended over budget.
            </p>
            {s.worst.length > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Most often over budget</p>
                {s.worst.map((u) => (
                  <UserLink key={u.hash} user={u} onOpen={onOpen} right={`${u.overWeeks}/${u.activeWeeks} wks`} />
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      <Section title="Top categories (all users)">
        {cats.length === 0 ? (
          <Empty>No spending logged yet.</Empty>
        ) : (
          <div className="space-y-3">
            {cats.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold text-gray-900 dark:text-gray-50">{c.icon} {c.name}</span>
                  <span className="font-mono tabular-nums text-gray-600 dark:text-gray-300">{formatMoney(c.amount, symbol)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full" style={{ width: `${Math.max((c.amount / maxCat) * 100, 5)}%`, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Latest activity">
        {recent.length === 0 ? (
          <Empty>No activity yet.</Empty>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recent.map(({ t, u }) => (
              <TxRow key={u.hash + t.id} tx={t} symbol={u.symbol} cat={u.categories.find((c) => c.id === t.categoryId)} extra={`${displayName(u)} · ${timeAgo(t.ts)}`} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Alerts({ s, symbol, onOpen }) {
  const total = s.overNow.length + s.inactive.length + s.large.length;
  return (
    <Section title="Alerts" hint="Over budget this week · inactive 14+ days · single expense ≥ half the weekly budget (last 7 days)">
      {total === 0 ? (
        <Empty>Nothing needs attention 🎉</Empty>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {s.large.map(({ u, t }) => (
            <UserLink key={u.hash + t.id} user={u} onOpen={onOpen} sub={`Large expense · ${timeAgo(t.ts)}`} right={formatMoney(t.amount, symbol)} />
          ))}
          {s.overNow.slice(0, 5).map((u) => (
            <UserLink key={"o" + u.hash} user={u} onOpen={onOpen} sub="Over budget this week" right={`${formatMoney(u.thisWeekSpent, u.symbol)} / ${formatMoney(u.weekAllowance, u.symbol)}`} />
          ))}
          {s.inactive.slice(0, 5).map((u) => (
            <UserLink key={"i" + u.hash} user={u} onOpen={onOpen} sub="Inactive" right={timeAgo(u.lastActivity)} />
          ))}
          {s.overNow.length > 5 && <p className="py-2 text-xs text-gray-400">+{s.overNow.length - 5} more over budget — use Users → “Over budget this week”.</p>}
          {s.inactive.length > 5 && <p className="py-2 text-xs text-gray-400">+{s.inactive.length - 5} more inactive — use Users → “Inactive”.</p>}
        </div>
      )}
    </Section>
  );
}
