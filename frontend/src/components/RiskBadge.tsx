interface RiskBadgeProps {
  level: "Baixo" | "Médio" | "Alto" | "Crítico";
}

const riskStyles: Record<string, string> = {
  Baixo: "bg-success/10 text-success border-success/30",
  Médio: "bg-warning/10 text-warning border-warning/30",
  Alto: "bg-danger/10 text-danger border-danger/30",
  Crítico: "bg-danger/20 text-danger border-danger/50",
};

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${riskStyles[level]}`}
    >
      {level}
    </span>
  );
}