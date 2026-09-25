import { useEffect, useState } from "react";

import { getMe } from "../services/auth";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getMe();
        setUsername(user.username);
      } catch {
        setUsername("");
      }
    }

    loadUser();
  }, []);

  return (
    <header className="border-b border-border px-4 py-4 sm:px-6 sm:py-5 md:px-8">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-100 sm:text-xl">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {username && (
          <div className="hidden shrink-0 text-right md:block">
            <p className="text-sm text-gray-300">
              Olá,{" "}
              <span className="font-semibold text-gray-100">
                {username}
              </span>
            </p>
          </div>
        )}
      </div>
    </header>
  );
}