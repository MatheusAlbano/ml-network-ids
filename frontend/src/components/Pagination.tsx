import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
      <span>
        Página {page + 1} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed hover:bg-border transition-colors"
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed hover:bg-border transition-colors"
        >
          Próxima <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}