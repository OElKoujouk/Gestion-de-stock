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
    <aside className="lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#111827] lg:bg-[#0b1120] lg:px-5 lg:py-6 lg:text-[#f9fafb]">
      <div className="hidden items-center justify-between lg:flex">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">Lycée Victor Hugo</p>
          <p className="text-lg font-semibold text-white">Gestion stock</p>
        </div>
        <span className="rounded-full bg-[#111827] px-3 py-1 text-xs text-[#e5e7eb]">v1.0</span>
      </div>

      <nav className="mt-8 hidden flex-1 flex-col gap-8 overflow-y-auto text-sm lg:flex">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{group.title}</p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left transition",
                      active === item.id
                        ? "bg-[#2563eb] text-[#eff6ff]"
                        : "text-[#e5e7eb] hover:bg-[#111827] hover:text-white",
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-auto border-t border-[#1f2937] pt-3 text-xs text-[#6b7280]">
          © {new Date().getFullYear()} Rectorat Demo
        </div>
      </nav>
    </aside>
  );
}
