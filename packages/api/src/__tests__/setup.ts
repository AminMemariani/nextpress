/**
 * Test setup for packages/api (tRPC router tests).
 * Reuses core test setup + adds tRPC caller factory.
 */

export { testPrisma, mockAuth, mockEditorAuth, mockContributorAuth, cleanDatabase } from "../../core/src/__tests__/setup";

import { appRouter } from "../root";
import { createCallerFactory } from "../trpc";
import type { AuthContext } from "@nextpress/core/auth/auth-types";

const createCaller = createCallerFactory(appRouter);

/** Create a typed tRPC caller with a mock auth context */
export function createTestCaller(auth: AuthContext) {
  return createCaller({
    session: auth.user,
    auth,
  });
}
