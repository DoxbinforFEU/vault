import { formatMoney } from "../lib/budget.js";

const card =
  "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden";

export default function DreamGoal({ dreamGoal, savedTotal, symbol }) {
  if (!dreamGoal) return null;

  const progress = Math.min(1, Math.max(0, savedTotal / dreamGoal.target));
  const pct = Math.round(progress * 100);
  
  // Calculate filter values
  // Blur goes from 10px down to 0px
  // Grayscale goes from 100% down to 0%
  const blurVal = Math.max(0, 10 - progress * 10);
  const grayVal = Math.max(0, 100 - progress * 100);

  return (
    <section className={`${card} mb-4 flex flex-col`}>
      <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-800">
        {dreamGoal.imageBase64 ? (
          <img
            src={dreamGoal.imageBase64}
            alt={dreamGoal.name}
            className="h-full w-full object-cover transition-all duration-1000 ease-out"
            style={{ filter: `blur(${blurVal}px) grayscale(${grayVal}%)` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white drop-shadow-md">
              {dreamGoal.name}
            </h2>
            <p className="text-sm font-medium text-white/90 drop-shadow-sm">
              {pct}% unlocked
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-white drop-shadow-md">
              {formatMoney(savedTotal, symbol)}
            </p>
            <p className="font-mono text-[10px] text-white/70 drop-shadow-sm">
              of {formatMoney(dreamGoal.target, symbol)}
            </p>
          </div>
        </div>
      </div>
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
        <div 
          className="h-full bg-sapphire transition-all duration-1000 ease-out" 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </section>
  );
}
