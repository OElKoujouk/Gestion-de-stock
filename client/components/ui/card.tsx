import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {subtitle ? (
          <p className="text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
