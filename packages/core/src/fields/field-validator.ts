/**
 * Dynamic Zod schema generation from FieldDefinitions.
 *
 * This is the bridge between the DB-stored field schema and runtime validation.
 * A FieldDefinition row says "price is a required NUMBER with min:0 max:9999".
 * This module turns that into a Zod schema that validates `{ price: 29.99 }`.
 *
 * Used by:
 *   - ContentService: validates field values on create/update
 *   - Admin UI: generates form controls with matching constraints
 *   - API layer: validates incoming field data
 */

import { z } from "zod";
import type { FieldDefinition } from "@prisma/client";
import { ValidationError } from "../errors/cms-error";

type Validation = Record<string, unknown>;

/** Build a Zod schema for a single FieldDefinition */
export function zodSchemaForField(def: FieldDefinition): z.ZodTypeAny {
  const v = (def.validation as Validation) ?? {};

  let schema: z.ZodTypeAny;

  switch (def.fieldType) {
    case "TEXT": {
      let s = z.string();
      if (def.isRequired && typeof v.minLength !== "number") s = s.min(1);
      if (typeof v.minLength === "number") s = s.min(v.minLength);
      if (typeof v.maxLength === "number") s = s.max(v.maxLength);
      if (typeof v.pattern === "string") s = s.regex(new RegExp(v.pattern));
      schema = s;
      break;
    }
    case "TEXTAREA": {
      let s = z.string();
      if (typeof v.maxLength === "number") s = s.max(v.maxLength);
      schema = s;
      break;
    }
    case "RICHTEXT":
      schema = z.string();
      break;
    case "NUMBER": {
      let s = z.number();
      if (typeof v.min === "number") s = s.min(v.min);
      if (typeof v.max === "number") s = s.max(v.max);
      schema = s;
      break;
    }
    case "BOOLEAN":
      schema = z.boolean();
      break;
    case "DATE":
      schema = z.string().date();
      break;
    case "DATETIME":
      schema = z.string().datetime();
      break;
    case "SELECT": {
      const opts = def.options as Array<{ value: string }> | null;
      if (opts?.length) {
        const values = opts.map((o) => o.value);
        schema = z.enum(values as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    }
    case "MULTISELECT": {
      const opts = def.options as Array<{ value: string }> | null;
      if (opts?.length) {
        const values = opts.map((o) => o.value);
        schema = z.array(z.enum(values as [string, ...string[]]));
      } else {
        schema = z.array(z.string());
      }
      break;
    }
    case "MEDIA":
      schema = z.string().cuid();
      break;
    case "RELATION": {
      const maxItems = typeof v.maxItems === "number" ? v.maxItems : undefined;
      if (maxItems === 1) {
        schema = z.string().cuid();
      } else {
        let arr = z.array(z.string().cuid());
        if (maxItems) arr = arr.max(maxItems);
        schema = z.union([z.string().cuid(), arr]);
      }
      break;
    }
    case "COLOR":
      schema = z.string().regex(
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
        "Must be a valid hex color",
      );
      break;
    case "URL":
      schema = z.string().url();
      break;
    case "EMAIL":
      schema = z.string().email();
      break;
    case "JSON":
      schema = z.unknown();
      break;
    default:
      schema = z.unknown();
  }

  if (!def.isRequired) {
    schema = schema.optional().nullable();
  }

  return schema;
}

/**
 * Build a Zod object schema for all fields of a content type.
 * Returns a z.object where each key is a field key and each value
 * is the appropriate Zod schema.
 */
export function buildFieldsSchema(
  definitions: FieldDefinition[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const def of definitions) {
    shape[def.key] = zodSchemaForField(def);
  }

  // Allow unknown keys to pass through (forward compatibility)
  return z.object(shape).passthrough();
}

/**
 * Validate a field values map against the content type's field definitions.
 * Returns the validated/coerced data or throws ValidationError.
 */
export function validateFields(
  definitions: FieldDefinition[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const schema = buildFieldsSchema(definitions);
  const result = schema.safeParse(values);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }

    throw new ValidationError("Field validation failed", {
      fieldErrors,
    });
  }

  return result.data;
}
