import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const variantMap: Record<BadgeVariant, string> = {
  info: "bg-sky-50 text-sky-700 ring-sky-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "info", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
