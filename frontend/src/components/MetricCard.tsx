import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accentColor?: "primary" | "danger" | "success" | "warning";
}

const accentClasses = {
  primary: "text-primary bg-primary/10",
  danger: "text-danger bg-danger/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};

export function MetricCard({ label, value, icon: Icon, accentColor = "primary" }: MetricCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${accentClasses[accentColor]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}