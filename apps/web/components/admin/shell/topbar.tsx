"use client";

import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-permissions";

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="h-14 border-b bg-white px-6 flex items-center justify-between shrink-0">
      {/* Left: breadcrumbs or search would go here */}
      <div />

      {/* Right: user menu */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {user?.name ?? user?.email ?? ""}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
