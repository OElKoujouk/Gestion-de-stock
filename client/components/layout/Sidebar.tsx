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
    <aside className="hidden border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-8 text-slate-100 lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">multi-etablissement</p>
          <p className="text-lg font-bold tracking-tight">Tableau de bord</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300 backdrop-blur">v1.0</span>
      </div>

      {/* Navigation */}
      <nav className="mt-10 hidden flex-1 flex-col gap-8 overflow-y-auto text-sm lg:flex">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.title}</p>

            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = active === item.id;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all",
                        "hover:bg-white/5 hover:text-white",
                        isActive ? "bg-white/10 text-white shadow-inner" : "text-slate-300",
                      )}
                    >
                      {/* Active indicator */}
                      {isActive ? <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-emerald-400" /> : null}

                      <span className="text-lg opacity-90" aria-hidden>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-auto border-t border-white/10 pt-4 text-xs text-slate-500">(c) {new Date().getFullYear()} Gestion multi-etablissement</div>
      </nav>
    </aside>
  );
}
