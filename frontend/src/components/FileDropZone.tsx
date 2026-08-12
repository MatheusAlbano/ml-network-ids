import { useCallback, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

interface FileDropZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export function FileDropZone({ selectedFile, onFileSelect }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onFileSelect(file);
  }

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between bg-surface-hover border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <FileText className="text-primary" size={20} />
          <div>
            <p className="text-sm text-gray-100 font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          onClick={() => onFileSelect(null)}
          className="text-gray-500 hover:text-danger transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border bg-surface-hover"
      }`}
    >
      <UploadCloud className="mx-auto text-gray-500 mb-3" size={32} />
      <p className="text-sm text-gray-300 mb-1">
        Arraste um arquivo CSV aqui, ou
      </p>
      <label className="inline-block cursor-pointer text-primary text-sm font-medium hover:underline">
        selecione manualmente
        <input type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
      </label>
      <p className="text-xs text-gray-600 mt-3">
        O arquivo deve conter as colunas esperadas pelo modelo (34 features)
      </p>
    </div>
  );
}