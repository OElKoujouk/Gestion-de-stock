import { cn } from "@/lib/utils";

export type NavItem<T extends string = string> = {
  id: T;
  label: string;
  icon: string;
};

export type NavGroup<T extends string = string> = {
  title: string;
  items: NavItem<T>[];
};

type SidebarProps<T extends string = string> = {
  groups: NavGroup<T>[];
  active: T;
  onSelect: (id: T) => void;
};

export function Sidebar<T extends string>({ groups, active, onSelect }: SidebarProps<T>) {
  return (
    <aside className="lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-slate-200/60 lg:bg-slate-950 lg:px-6 lg:py-8 lg:text-slate-50">
      <div className="hidden items-center justify-between lg:flex">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Lycée Victor Hugo</p>
          <p className="text-xl font-semibold leading-tight text-white">Gestion du stock</p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-200">v1.0</span>
      </div>

      <nav className="mt-10 hidden flex-1 flex-col gap-8 overflow-y-auto text-sm lg:flex">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title}</p>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={active === item.id ? "page" : undefined}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition",
                      active === item.id
                        ? "bg-emerald-500 text-slate-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.7)]"
                        : "text-slate-200 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <span className="text-lg" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-auto border-t border-white/10 pt-4 text-xs text-slate-500">
          © {new Date().getFullYear()} Rectorat Demo
        </div>
      </nav>
    </aside>
  );
}
