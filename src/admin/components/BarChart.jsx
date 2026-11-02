import { compactMoney } from "../../lib/ringFormat.js";

/**
 * Small stacked SVG bar chart.
 * bars = [{ label, segments: [{ name, color, value }] }]. `money` formats values as ₱ amounts (centavos).
 */
export default function BarChart({ bars, money = false, symbol = "₱", legend }) {
  const VBW = 340, VBH = 150, TOP = 16, AX = 34, BOT = 22;
  const chartH = VBH - TOP - BOT;
  const chartW = VBW - AX;
  const fmt = (v) => (money ? compactMoney(v, symbol) : String(Math.round(v)));
  const totals = bars.map((b) => b.segments.reduce((s, x) => s + x.value, 0));
  const max = Math.max(1, ...totals);
  const slot = chartW / Math.max(1, bars.length);
  const bw = Math.min(slot * 0.62, 26);
  const step = bars.length > 9 ? Math.ceil(bars.length / 9) : 1;
  const showVals = bars.length <= 10;
  const empty = totals.every((t) => t === 0);

  return (
    <div>
      <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" role="img" aria-label={empty ? "No data yet" : "Bar chart"}>
        {[0, 1].map((f) => {
          const y = TOP + chartH - f * chartH;
          return (
            <g key={f}>
              <line x1={AX} x2={VBW} y1={y} y2={y} className="stroke-gray-200 dark:stroke-gray-800" strokeWidth="1" />
              <text x={AX - 6} y={y + 3} textAnchor="end" className="fill-gray-500 dark:fill-gray-400" style={{ fontSize: 9 }}>
                {fmt(max * f)}
              </text>
            </g>
          );
        })}
        {bars.map((b, i) => {
          const x = AX + i * slot + (slot - bw) / 2;
          let y = TOP + chartH;
          return (
            <g key={i}>
              <title>{`${b.label}: ${fmt(totals[i])}`}</title>
              {b.segments.map((s, k) => {
                const h = (s.value / max) * chartH;
                y -= h;
                return h > 0 ? <rect key={k} x={x} y={y} width={bw} height={h} fill={s.color} rx={k === b.segments.length - 1 ? 3 : 0} /> : null;
              })}
              {showVals && totals[i] > 0 && (
                <text x={x + bw / 2} y={TOP + chartH - (totals[i] / max) * chartH - 3} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" style={{ fontSize: 8.5 }}>
                  {fmt(totals[i])}
                </text>
              )}
              {i % step === 0 && (
                <text x={x + bw / 2} y={VBH - 7} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" style={{ fontSize: 9 }}>
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {empty && <p className="-mt-1 text-center text-xs text-gray-400">No data in this period yet.</p>}
      {legend && legend.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          {legend.map((l) => (
            <span key={l.name} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} /> {l.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
