import { StatCard } from "@nextpress/ui";

interface Props {
  stats: Array<{ label: string; value: number | string }>;
}

export function StatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  );
}
