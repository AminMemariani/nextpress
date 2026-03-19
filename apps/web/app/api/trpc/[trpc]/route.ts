import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@nextpress/api";
import { getAuthContext, getCurrentUser } from "@/lib/auth/session";
import { setRevalidationCallbacks } from "@nextpress/api/routers/content";
import { revalidateForEntry, revalidateForDeletion } from "@/lib/cache/revalidate-content";

// Register revalidation callbacks at module load.
// This keeps the dependency arrow: apps/web → packages/api (never reverse).
setRevalidationCallbacks({
  onEntryChange: revalidateForEntry,
  onEntryDelete: revalidateForDeletion,
});

const handler = async (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const auth = await getAuthContext();
      const user = await getCurrentUser();
      return { session: user, auth };
    },
  });

export { handler as GET, handler as POST };
