import { vi } from "vitest";

/**
 * Creates a mock Prisma client for unit tests.
 * Each model method returns vi.fn() that you can configure per-test.
 */
export function createMockPrisma() {
  const createModelMock = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  });

  return {
    contentEntry: createModelMock(),
    contentType: createModelMock(),
    comment: createModelMock(),
    taxonomy: createModelMock(),
    term: createModelMock(),
    setting: createModelMock(),
    revision: createModelMock(),
    fieldDefinition: createModelMock(),
    fieldValue: createModelMock(),
    contentTerm: createModelMock(),
    contentMedia: createModelMock(),
    mediaAsset: createModelMock(),
    menu: createModelMock(),
    menuItem: createModelMock(),
    pluginInstall: createModelMock(),
    permission: createModelMock(),
    themeInstall: createModelMock(),
    $transaction: vi.fn((fn: Function) => fn(mockPrisma)),
    $queryRaw: vi.fn(),
  };
}

// Singleton for use in vi.mock
export const mockPrisma = createMockPrisma();

/**
 * Reset all mock functions. Call in beforeEach.
 */
export function resetMockPrisma() {
  const resetModel = (model: Record<string, any>) => {
    for (const fn of Object.values(model)) {
      if (typeof fn === "function" && "mockReset" in fn) {
        (fn as any).mockReset();
      }
    }
  };

  for (const [key, value] of Object.entries(mockPrisma)) {
    if (key === "$transaction") {
      (value as any).mockReset();
      (value as any).mockImplementation((fn: Function) => fn(mockPrisma));
    } else {
      resetModel(value as Record<string, any>);
    }
  }
}
