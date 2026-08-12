import { useEffect, useState } from "react";
import { getInputSchema } from "../services/schemaService";
import type { InputSchema } from "../types/schema";

export function useInputSchema() {
  const [schema, setSchema] = useState<InputSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInputSchema()
      .then(setSchema)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { schema, loading, error };
}