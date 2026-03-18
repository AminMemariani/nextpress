"use client";

import { SessionProvider } from "next-auth/react";
import { TrpcProvider } from "@/lib/trpc/provider";
import { ToastProvider } from "@nextpress/ui";

/**
 * Client provider boundary for the admin panel.
 * Wraps children with: Session, tRPC/React-Query, Toast.
 *
 * This is the ONLY "use client" boundary in the admin layout.
 * Everything below it can use hooks (useSession, trpc.*.useQuery, useToast).
 */
export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TrpcProvider>
        <ToastProvider>{children}</ToastProvider>
      </TrpcProvider>
    </SessionProvider>
  );
}
