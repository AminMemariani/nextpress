/**
 * Integration tests for ContentService.
 *
 * These hit a real test database. Slower than unit tests but catch
 * Prisma query bugs, constraint violations, and transaction issues.
 *
 * Requires: TEST_DATABASE_URL env var pointing to a test Postgres instance.
 */

import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { testPrisma, mockAuth, mockContributorAuth, cleanDatabase } from "../setup";
import { contentService } from "../../content/content-service";
import { contentTypeService } from "../../content-type/content-type-service";

// Override prisma with test instance (would use dependency injection in production)
// For now, assumes the test database is configured via DATABASE_URL

let siteId: string;
let contentTypeId: string;

beforeAll(async () => {
  // Create test site
  const site = await testPrisma.site.upsert({
    where: { slug: "test" },
    update: {},
    create: { slug: "test", name: "Test Site", isActive: true },
  });
  siteId = site.id;
});

beforeEach(async () => {
  await cleanDatabase();

  // Create test user
  await testPrisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { id: "test-user-id", email: "test@example.com", name: "Test" },
  });

  // Create content type
  const ct = await testPrisma.contentType.create({
    data: {
      siteId,
      slug: "post",
      nameSingular: "Post",
      namePlural: "Posts",
      isSystem: true,
      supports: ["title", "editor", "excerpt", "revisions", "comments"],
    },
  });
  contentTypeId = ct.id;
});

describe("contentService.create()", () => {
  it("creates a draft entry", async () => {
    const auth = mockAuth({ siteId });
    const entry = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "My First Post",
      blocks: [],
      status: "DRAFT",
      fields: {},
      termIds: [],
    });

    expect(entry.title).toBe("My First Post");
    expect(entry.slug).toBe("my-first-post");
    expect(entry.status).toBe("DRAFT");
    expect(entry.publishedAt).toBeNull();
  });

  it("auto-generates unique slug from title", async () => {
    const auth = mockAuth({ siteId });

    const entry1 = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "Duplicate Title",
      blocks: [],
      fields: {},
      termIds: [],
    });

    const entry2 = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "Duplicate Title",
      blocks: [],
      fields: {},
      termIds: [],
    });

    expect(entry1.slug).toBe("duplicate-title");
    expect(entry2.slug).toBe("duplicate-title-2");
  });

  it("sets publishedAt when status is PUBLISHED", async () => {
    const auth = mockAuth({ siteId });
    const entry = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "Published Post",
      blocks: [],
      status: "PUBLISHED",
      fields: {},
      termIds: [],
    });

    expect(entry.status).toBe("PUBLISHED");
    expect(entry.publishedAt).not.toBeNull();
  });

  it("requires publish_content permission to publish", async () => {
    const auth = mockContributorAuth();
    auth.siteId = siteId;

    await expect(
      contentService.create(auth, {
        contentTypeSlug: "post",
        title: "Should Fail",
        blocks: [],
        status: "PUBLISHED",
        fields: {},
        termIds: [],
      }),
    ).rejects.toThrow();
  });

  it("creates initial revision", async () => {
    const auth = mockAuth({ siteId });
    const entry = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "Revised Post",
      blocks: [],
      fields: {},
      termIds: [],
    });

    expect(entry.revisionCount).toBe(1);
  });
});

describe("contentService.transition()", () => {
  it("transitions DRAFT → PUBLISHED", async () => {
    const auth = mockAuth({ siteId });
    const entry = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "Draft to Publish",
      blocks: [],
      fields: {},
      termIds: [],
    });

    const published = await contentService.publish(auth, entry.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();
  });

  it("rejects invalid transitions", async () => {
    const auth = mockAuth({ siteId });
    const entry = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "Draft",
      blocks: [],
      fields: {},
      termIds: [],
    });

    // DRAFT → ARCHIVED is not allowed
    await expect(
      contentService.archive(auth, entry.id),
    ).rejects.toThrow("Cannot transition");
  });

  it("TRASH → only allows restore to DRAFT", async () => {
    const auth = mockAuth({ siteId });
    const entry = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "To Trash",
      blocks: [],
      fields: {},
      termIds: [],
    });

    const trashed = await contentService.trash(auth, entry.id);
    expect(trashed.status).toBe("TRASH");

    const restored = await contentService.restore(auth, entry.id);
    expect(restored.status).toBe("DRAFT");
  });
});

describe("contentService.delete()", () => {
  it("only deletes from TRASH", async () => {
    const auth = mockAuth({ siteId });
    const entry = await contentService.create(auth, {
      contentTypeSlug: "post",
      title: "Delete Me",
      blocks: [],
      fields: {},
      termIds: [],
    });

    // Can't delete a DRAFT directly
    await expect(contentService.delete(auth, entry.id)).rejects.toThrow("TRASH");

    // Trash first, then delete
    await contentService.trash(auth, entry.id);
    await contentService.delete(auth, entry.id);

    await expect(contentService.getById(siteId, entry.id)).rejects.toThrow("not found");
  });
});

describe("contentService.list()", () => {
  it("filters by status", async () => {
    const auth = mockAuth({ siteId });

    await contentService.create(auth, { contentTypeSlug: "post", title: "Draft 1", blocks: [], fields: {}, termIds: [] });
    await contentService.create(auth, { contentTypeSlug: "post", title: "Published 1", blocks: [], status: "PUBLISHED", fields: {}, termIds: [] });

    const drafts = await contentService.list(siteId, {
      contentTypeSlug: "post",
      status: "DRAFT",
    });
    expect(drafts.items.every((i) => i.status === "DRAFT")).toBe(true);

    const published = await contentService.list(siteId, {
      contentTypeSlug: "post",
      status: "PUBLISHED",
    });
    expect(published.items.every((i) => i.status === "PUBLISHED")).toBe(true);
  });

  it("searches by title", async () => {
    const auth = mockAuth({ siteId });

    await contentService.create(auth, { contentTypeSlug: "post", title: "TypeScript Guide", blocks: [], fields: {}, termIds: [] });
    await contentService.create(auth, { contentTypeSlug: "post", title: "Rust Tutorial", blocks: [], fields: {}, termIds: [] });

    const results = await contentService.list(siteId, {
      contentTypeSlug: "post",
      search: "typescript",
    });
    expect(results.items).toHaveLength(1);
    expect(results.items[0].title).toBe("TypeScript Guide");
  });

  it("paginates correctly", async () => {
    const auth = mockAuth({ siteId });
    for (let i = 0; i < 5; i++) {
      await contentService.create(auth, {
        contentTypeSlug: "post",
        title: `Post ${i}`,
        blocks: [],
        fields: {},
        termIds: [],
      });
    }

    const page1 = await contentService.list(siteId, {
      contentTypeSlug: "post",
      page: 1,
      perPage: 2,
    });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.totalPages).toBe(3);
  });
});
