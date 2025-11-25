import { NavGroup } from "@/components/layout/Sidebar";

type MobileNavProps<T extends string = string> = {
  groups: NavGroup<T>[];
  active: T;
  onSelect: (id: T) => void;
};

export function MobileNav<T extends string>({
  groups,
  active,
  onSelect,
}: MobileNavProps<T>) {
  const flatItems = groups.flatMap((group) => group.items);

  return (
    <div className="sticky top-0 z-10 bg-slate-100/90 px-4 py-4 backdrop-blur-lg lg:hidden">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Lycée Victor Hugo
          </p>
          <p className="text-lg font-semibold text-slate-900">Gestion stock</p>
        </div>
        <select
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900"
          value={active}
          onChange={(event) => onSelect(event.target.value as T)}
        >
          {flatItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.icon} {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
