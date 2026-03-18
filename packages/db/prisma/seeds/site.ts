import type { PrismaClient } from "@prisma/client";

export async function seedDefaultSite(prisma: PrismaClient) {
  console.log("Seeding default site...");

  const site = await prisma.site.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      slug: "default",
      name: "My NextPress Site",
      tagline: "Just another NextPress site",
      locale: "en",
      timezone: "UTC",
      isActive: true,
    },
  });

  console.log(`  ✓ Default site created: ${site.id}`);
  return site;
}
