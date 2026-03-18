/**
 * tRPC permission middleware — re-exported from trpc.ts.
 *
 * Usage in routers:
 *
 *   import { permissionProcedure } from "../middleware/permissions";
 *
 *   export const settingsRouter = router({
 *     get: authedProcedure.query(...),
 *     update: permissionProcedure("manage_settings").mutation(...),
 *   });
 */

export { permissionProcedure, anyPermissionProcedure } from "../trpc";
