import type { ConfusionMatrix } from "../types/statistics";

export function ConfusionMatrixGrid({ matrix }: { matrix: ConfusionMatrix }) {
  const total =
    matrix.true_negative + matrix.false_positive + matrix.false_negative + matrix.true_positive;

  const cells = [
    { label: "Verdadeiro Normal", value: matrix.true_negative, tone: "success" },
    { label: "Falso Ataque", value: matrix.false_positive, tone: "warning" },
    { label: "Falso Normal", value: matrix.false_negative, tone: "warning" },
    { label: "Verdadeiro Ataque", value: matrix.true_positive, tone: "success" },
  ] as const;

  const toneClasses = {
    success: "bg-success/10 border-success/30 text-success",
    warning: "bg-warning/10 border-warning/30 text-warning",
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className={`border rounded-xl p-5 text-center ${toneClasses[cell.tone]}`}
          >
            <p className="text-2xl font-bold">{cell.value.toLocaleString("pt-BR")}</p>
            <p className="text-xs mt-1 opacity-80">{cell.label}</p>
            <p className="text-xs mt-0.5 opacity-60">
              {((cell.value / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 text-center text-xs text-gray-500 mt-2">
        <span>Previsto: Normal</span>
        <span>Previsto: Ataque</span>
      </div>
    </div>
  );
}