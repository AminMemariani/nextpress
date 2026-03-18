import "server-only";

import { createCallerFactory } from "@nextpress/api";
import { appRouter } from "@nextpress/api";
import { getAuthContext, getCurrentUser } from "../auth/session";

const createCaller = createCallerFactory(appRouter);

export async function getServerCaller() {
  const auth = await getAuthContext();
  const user = await getCurrentUser();
  return createCaller({ session: user, auth });
}
