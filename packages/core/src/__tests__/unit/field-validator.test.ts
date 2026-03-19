import { describe, it, expect } from "vitest";
import { zodSchemaForField, validateFields, buildFieldsSchema } from "../../fields/field-validator";

// Helper to create a minimal FieldDefinition
function field(overrides: Record<string, any>) {
  return {
    id: "fd-1", siteId: "s-1", contentTypeId: null,
    key: "test", name: "Test", description: null,
    fieldType: "TEXT", isRequired: false,
    defaultValue: null, validation: null, options: null,
    group: "test", sortOrder: 0, source: "core",
    ...overrides,
  } as any;
}

describe("zodSchemaForField()", () => {
  it("validates TEXT field", () => {
    const schema = zodSchemaForField(field({ fieldType: "TEXT" }));
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
  });

  it("validates NUMBER field with min/max", () => {
    const schema = zodSchemaForField(field({
      fieldType: "NUMBER",
      validation: { min: 0, max: 100 },
    }));
    expect(schema.safeParse(50).success).toBe(true);
    expect(schema.safeParse(-1).success).toBe(false);
    expect(schema.safeParse(101).success).toBe(false);
  });

  it("validates BOOLEAN field", () => {
    const schema = zodSchemaForField(field({ fieldType: "BOOLEAN" }));
    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse("true").success).toBe(false);
  });

  it("validates SELECT field against options", () => {
    const schema = zodSchemaForField(field({
      fieldType: "SELECT",
      options: [{ label: "Red", value: "red" }, { label: "Blue", value: "blue" }],
    }));
    expect(schema.safeParse("red").success).toBe(true);
    expect(schema.safeParse("green").success).toBe(false);
  });

  it("validates EMAIL field", () => {
    const schema = zodSchemaForField(field({ fieldType: "EMAIL" }));
    expect(schema.safeParse("test@example.com").success).toBe(true);
    expect(schema.safeParse("not-an-email").success).toBe(false);
  });

  it("allows null/undefined for optional fields", () => {
    const schema = zodSchemaForField(field({ fieldType: "TEXT", isRequired: false }));
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it("requires value for required fields", () => {
    const schema = zodSchemaForField(field({ fieldType: "TEXT", isRequired: true }));
    expect(schema.safeParse("").success).toBe(false); // empty string fails min(1)
    expect(schema.safeParse(null).success).toBe(false);
  });
});

describe("validateFields()", () => {
  it("validates multiple fields together", () => {
    const defs = [
      field({ key: "name", fieldType: "TEXT", isRequired: true }),
      field({ key: "age", fieldType: "NUMBER" }),
    ];
    const result = validateFields(defs, { name: "John", age: 30 });
    expect(result.name).toBe("John");
    expect(result.age).toBe(30);
  });

  it("throws ValidationError on invalid data", () => {
    const defs = [
      field({ key: "email", fieldType: "EMAIL", isRequired: true }),
    ];
    expect(() => validateFields(defs, { email: "not-valid" })).toThrow();
  });
});
