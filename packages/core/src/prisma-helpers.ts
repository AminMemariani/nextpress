/**
 * Prisma JSON type helpers.
 *
 * Prisma's InputJsonValue is stricter than Record<string, unknown>.
 * These helpers bridge the gap by casting validated data to Prisma's
 * expected JSON types.
 */

import { Prisma } from "@prisma/client";

/** Cast a value to Prisma's InputJsonValue for JSON column writes */
export function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Cast a nullable value for Prisma's nullable JSON column writes */
export function toNullableJsonInput(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === null) return Prisma.JsonNull;
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}
