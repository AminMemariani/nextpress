import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@nextpress/api";
import { getAuthContext, getCurrentUser } from "@/lib/auth/session";

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
