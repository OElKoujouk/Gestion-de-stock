type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function SectionHeader({ eyebrow, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="max-w-3xl text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
