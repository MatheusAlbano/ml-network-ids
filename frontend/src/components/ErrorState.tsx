// frontend/src/components/ErrorState.tsx
import { AlertTriangle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-danger py-16">
      <AlertTriangle size={24} />
      <span className="text-sm text-center max-w-md">{message}</span>
    </div>
  );
}