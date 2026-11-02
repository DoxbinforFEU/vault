import { useMemo, useState } from "react";
import { filterSortUsers, paginate, RANGE_ALL } from "./userModel.js";

/** Search / sort / status / date-range / page state. Any filter change returns to page 1. `all` = every match (for exports). */
export function useUserList(users, init = {}) {
  const [query, setQ] = useState("");
  const [sortKey, setS] = useState(init.sortKey || "lastActivity");
  const [dir, setD] = useState(init.dir || "desc");
  const [status, setSt] = useState("all");
  const [range, setR] = useState(RANGE_ALL);
  const [page, setPage] = useState(0);

  const all = useMemo(
    () => filterSortUsers(users, { query, sortKey, dir, status, range }),
    [users, query, sortKey, dir, status, range]
  );
  const view = useMemo(() => paginate(all, page), [all, page]);
  const reset = (fn) => (v) => { fn(v); setPage(0); };

  return {
    ...view,
    all,
    query, sortKey, dir, status, range,
    setQuery: reset(setQ),
    setSortKey: reset(setS),
    setStatus: reset(setSt),
    setRange: reset(setR),
    toggleDir: () => { setD((d) => (d === "asc" ? "desc" : "asc")); setPage(0); },
    prev: () => setPage(Math.max(0, view.page - 1)),
    next: () => setPage(Math.min(view.pages - 1, view.page + 1)),
  };
}
