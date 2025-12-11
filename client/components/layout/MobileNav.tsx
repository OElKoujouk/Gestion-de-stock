import { useState } from "react";

import { NavGroup } from "@/components/layout/Sidebar";

type MobileNavProps<T extends string = string> = {
  groups: NavGroup<T>[];
  active: T;
  onSelect: (id: T) => void;
};

export function MobileNav<T extends string>({ groups, active, onSelect }: MobileNavProps<T>) {
  const [open, setOpen] = useState(false);
  const flatItems = groups.flatMap((group) => group.items);

  return (
    <div className="sticky top-0 z-10 border-b border-emerald-100/60 bg-white/80 px-4 py-4 backdrop-blur lg:hidden">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Lycée Victor Hugo</p>
            <p className="text-lg font-semibold leading-tight text-slate-900">Gestion du stock</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={open ? "Fermer la navigation" : "Ouvrir la navigation"}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100 bg-white text-slate-900 shadow-sm transition hover:border-emerald-200"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col items-center justify-center gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-slate-900" />
                <span className="block h-0.5 w-5 rounded-full bg-slate-900" />
                <span className="block h-0.5 w-5 rounded-full bg-slate-900" />
              </span>
            </button>
          </div>
        </div>
        {/* Navigation uniquement via hamburger */}
        {open ? (
          <nav className="mt-1 grid gap-1 rounded-2xl border border-emerald-100 bg-white/90 p-2 shadow-sm">
            {flatItems.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    isActive ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100" : "text-slate-800 hover:bg-emerald-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="text-lg">
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  {isActive ? (
                    <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                      Actif
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

