interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label: string };
  className?: string;
}

export function StatCard({ label, value, change, className = "" }: StatCardProps) {
  return (
    <div className={`np-stat-card rounded-lg border bg-white p-6 ${className}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${change.value >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change.value >= 0 ? "+" : ""}{change.value}% {change.label}
        </p>
      )}
    </div>
  );
}
