export function ProgressBar({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400">{label}</p>
      <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-primary rounded-full animate-[loading_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}