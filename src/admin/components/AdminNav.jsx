import { HomeIcon, ClockIcon, UsersIcon } from "../../components/icons.jsx";

const TABS = [
  { key: "overview", label: "Overview", Icon: HomeIcon },
  { key: "activity", label: "Activity", Icon: ClockIcon },
  { key: "users", label: "Users", Icon: UsersIcon },
];

export default function AdminNav({ view, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            aria-label={label}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 ${
              view === key ? "text-sapphire" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <Icon size={24} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
