import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { fieldService } = await import("../../fields/field-service");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set(["manage_fields", "read", "edit_profile"]),
};

const noPermsAuth: AuthContext = {
  ...adminAuth,
  role: "subscriber",
  permissions: new Set(["read"]),
};

const mockField = {
  id: "fd-1",
  siteId: "site-1",
  contentTypeId: "ct-1",
  key: "subtitle",
  name: "Subtitle",
  description: null,
  fieldType: "TEXT",
  isRequired: false,
  defaultValue: null,
  validation: null,
  options: null,
  group: "custom-fields",
  sortOrder: 0,
  source: "core",
};

beforeEach(() => {
  resetMockPrisma();
});

describe("fieldService.create", () => {
  it("throws without manage_fields permission", async () => {
    await expect(
      fieldService.create(noPermsAuth, {
        key: "subtitle",
        name: "Subtitle",
        fieldType: "TEXT",
      }),
    ).rejects.toThrow("lacks permission");
  });

  it("throws for duplicate key", async () => {
    mockPrisma.fieldDefinition.findUnique.mockResolvedValue(mockField);
    await expect(
      fieldService.create(adminAuth, {
        key: "subtitle",
        name: "Subtitle",
        fieldType: "TEXT",
      }),
    ).rejects.toThrow('Field key "subtitle" already exists');
  });

  it("verifies content type exists when contentTypeId provided", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue(null);
    await expect(
      fieldService.create(adminAuth, {
        key: "subtitle",
        name: "Subtitle",
        fieldType: "TEXT",
        contentTypeId: "clh1234567890abcdef",
      }),
    ).rejects.toThrow("not found");
  });

  it("creates field definition", async () => {
    mockPrisma.fieldDefinition.findUnique.mockResolvedValue(null);
    mockPrisma.fieldDefinition.create.mockResolvedValue(mockField);

    const result = await fieldService.create(adminAuth, {
      key: "subtitle",
      name: "Subtitle",
      fieldType: "TEXT",
    });
    expect(result.key).toBe("subtitle");
    expect(result.fieldType).toBe("TEXT");
  });
});

describe("fieldService.update", () => {
  it("throws NotFoundError for missing field", async () => {
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue(null);
    await expect(
      fieldService.update(adminAuth, "bad", { name: "New" }),
    ).rejects.toThrow("not found");
  });

  it("updates field definition", async () => {
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue(mockField);
    mockPrisma.fieldDefinition.update.mockResolvedValue({ ...mockField, name: "New Name" });

    const result = await fieldService.update(adminAuth, "fd-1", { name: "New Name" });
    expect(result.name).toBe("New Name");
  });
});

describe("fieldService.delete", () => {
  it("throws NotFoundError for missing field", async () => {
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue(null);
    await expect(fieldService.delete(adminAuth, "bad")).rejects.toThrow("not found");
  });

  it("deletes field definition", async () => {
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue(mockField);
    mockPrisma.fieldDefinition.delete.mockResolvedValue({});
    await fieldService.delete(adminAuth, "fd-1");
    expect(mockPrisma.fieldDefinition.delete).toHaveBeenCalledWith({ where: { id: "fd-1" } });
  });
});

describe("fieldService.listByContentType", () => {
  it("returns fields for content type", async () => {
    mockPrisma.fieldDefinition.findMany.mockResolvedValue([mockField]);
    const result = await fieldService.listByContentType("site-1", "ct-1");
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("subtitle");
  });
});

describe("fieldService.registerBulk", () => {
  it("throws for unknown content type", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(null);
    await expect(
      fieldService.registerBulk(adminAuth, "unknown", [], "plugin"),
    ).rejects.toThrow("not found");
  });

  it("creates multiple fields", async () => {
    const ctId = "clh1234567890abcdef";
    mockPrisma.contentType.findUnique.mockResolvedValue({ id: ctId });
    // create() internally calls findFirst for content type verification
    mockPrisma.contentType.findFirst.mockResolvedValue({ id: ctId, siteId: "site-1" });
    mockPrisma.fieldDefinition.findUnique.mockResolvedValue(null);
    mockPrisma.fieldDefinition.create.mockResolvedValue(mockField);

    const result = await fieldService.registerBulk(
      adminAuth,
      "post",
      [
        { key: "subtitle", name: "Subtitle", fieldType: "TEXT" },
        { key: "color", name: "Color", fieldType: "COLOR" },
      ],
      "my-plugin",
    );
    expect(result).toHaveLength(2);
  });
});
