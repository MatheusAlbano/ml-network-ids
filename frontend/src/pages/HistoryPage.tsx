import { useEffect } from "react";

import {
  History,
  ListFilter,
  Database,
} from "lucide-react";

import { Header } from "../components/Header";

import { LoadingState } from "../components/LoadingState";

import { ErrorState } from "../components/ErrorState";

import { HistoryFiltersBar } from "../components/HistoryFiltersBar";

import { HistoryTable } from "../components/HistoryTable";

import { Pagination } from "../components/Pagination";

import { useHistory } from "../hooks/useHistory";

import { useToast } from "../components/ToastContext";

export function HistoryPage() {
  const {
    data,
    loading,
    error,
    page,
    totalPages,
    setPage,
    applyFilters,
  } = useHistory();

  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      showToast(
        `Falha ao carregar histórico: ${error}`,
        "error"
      );
    }
  }, [error, showToast]);

  return (
    <>
      <Header
        title="Histórico"
        subtitle="Consulte e acompanhe as análises realizadas"
      />

      <div className="space-y-6 p-8">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History size={22} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-100">
                  Registro de análises
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Consulte as conexões analisadas anteriormente,
                  seus resultados de classificação e os detalhes
                  registrados pelo sistema.
                </p>
              </div>
            </div>

            {data && (
              <div className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Registros
                </p>

                <p className="mt-1 text-xl font-bold text-gray-100">
                  {data.total.toLocaleString("pt-BR")}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListFilter size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-200">
                Filtros
              </h3>

              <p className="text-xs text-muted-foreground">
                Refine os resultados do histórico.
              </p>
            </div>
          </div>

          <HistoryFiltersBar onApply={applyFilters} />
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Database size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-200">
                  Análises registradas
                </h3>

                {data && (
                  <p className="text-xs text-muted-foreground">
                    {data.total === 1
                      ? "1 análise encontrada"
                      : `${data.total.toLocaleString(
                          "pt-BR"
                        )} análises encontradas`}
                  </p>
                )}
              </div>
            </div>

            {data && data.total > 0 && totalPages > 1 && (
              <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </p>
            )}
          </div>

          <div className="p-5">
            {loading && (
              <LoadingState label="Carregando histórico..." />
            )}

            {error && (
              <ErrorState
                message={`Falha ao carregar histórico: ${error}`}
              />
            )}

            {data && (
              <>
                {data.items.length > 0 ? (
                  <>
                    <HistoryTable items={data.items} />

                    <div className="mt-5 border-t border-border pt-5">
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/40 px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <History size={22} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-200">
                      Nenhuma análise encontrada
                    </h3>

                    <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                      Não existem análises que correspondam aos
                      filtros selecionados. Tente ajustar os filtros
                      ou realize uma nova análise de conexão.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}