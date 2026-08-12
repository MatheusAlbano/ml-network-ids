import { Header } from "../components/Header";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { HistoryFiltersBar } from "../components/HistoryFiltersBar";
import { HistoryTable } from "../components/HistoryTable";
import { Pagination } from "../components/Pagination";
import { useHistory } from "../hooks/useHistory";

export function HistoryPage() {
  const { data, loading, error, page, totalPages, setPage, applyFilters } = useHistory();

  return (
    <>
      <Header title="Histórico" subtitle="Análises realizadas" />

      <div className="p-8">
        <HistoryFiltersBar onApply={applyFilters} />

        <div className="bg-surface border border-border rounded-xl p-4">
          {loading && <LoadingState label="Carregando histórico..." />}
          {error && <ErrorState message={`Falha ao carregar histórico: ${error}`} />}

          {data && (
            <>
              <p className="text-xs text-gray-500 mb-3">
                {data.total} {data.total === 1 ? "análise encontrada" : "análises encontradas"}
              </p>
              <HistoryTable items={data.items} />
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </>
  );
}