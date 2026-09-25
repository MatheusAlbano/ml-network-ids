import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getMe } from "../services/auth";

export function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuthentication() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        await getMe();
        setAuthenticated(true);
      } catch {
        localStorage.removeItem("access_token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Verificando autenticação...
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}