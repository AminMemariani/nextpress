/**
 * tRPC auth middleware — re-exported from trpc.ts.
 *
 * The auth enforcement is defined inline in trpc.ts (enforceAuth middleware)
 * because it needs access to the tRPC middleware builder.
 *
 * This file exists as a reference and for any auth-specific middleware
 * helpers that don't need the tRPC builder.
 */

export { authedProcedure } from "../trpc";
