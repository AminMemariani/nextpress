type Variant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return <span className={`np-badge np-badge-${variant} ${className}`}>{children}</span>;
}

/** Map ContentStatus to Badge variant */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    PUBLISHED: "success", DRAFT: "outline", PENDING_REVIEW: "warning",
    SCHEDULED: "info", PRIVATE: "default", ARCHIVED: "default", TRASH: "danger",
  };
  return <Badge variant={map[status] ?? "default"}>{status.replace("_", " ").toLowerCase()}</Badge>;
}
