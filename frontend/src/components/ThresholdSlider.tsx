import { RotateCcw } from "lucide-react";

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  onReset: () => void;
}

export function ThresholdSlider({ value, onChange, onReset }: ThresholdSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-300">
          Limiar de Classificação: <span className="text-primary font-semibold">{value.toFixed(2)}</span>
        </label>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RotateCcw size={12} /> Restaurar padrão
        </button>
      </div>
      <input
        type="range"
        min={0.1}
        max={0.9}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <p className="text-xs text-gray-500 mt-2">
        Conexões com probabilidade de ataque acima deste valor são classificadas como "Ataque".
        Valores menores tornam o sistema mais sensível (mais alertas, incluindo possíveis falsos
        positivos); valores maiores tornam o sistema mais conservador.
      </p>
    </div>
  );
}