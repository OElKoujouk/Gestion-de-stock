import { NavGroup } from "@/components/layout/Sidebar";

type MobileNavProps<T extends string = string> = {
  groups: NavGroup<T>[];
  active: T;
  onSelect: (id: T) => void;
};

export function MobileNav<T extends string>({ groups, active, onSelect }: MobileNavProps<T>) {
  const flatItems = groups.flatMap((group) => group.items);

  return (
    <div className="sticky top-0 z-10 border-b border-emerald-100/60 bg-white/80 px-4 py-4 backdrop-blur lg:hidden">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Lycée Victor Hugo</p>
            <p className="text-lg font-semibold leading-tight text-slate-900">Gestion du stock</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800">v1.0</span>
        </div>
        <label className="text-xs font-semibold text-slate-600">
          Naviguer
          <select
            className="mt-1 rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
            value={active}
            aria-label="Navigation mobile"
            onChange={(event) => onSelect(event.target.value as T)}
          >
            {flatItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
