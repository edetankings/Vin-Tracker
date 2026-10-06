import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-surface flex flex-col items-center rounded-[32px] border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <div className="empty-icon mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary [&_svg]:size-8">
        {icon}
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-[16rem] text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
