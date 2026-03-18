import { PrismaClient } from "@prisma/client";
import { seedPermissions } from "./seeds/permissions";
import { seedRoles } from "./seeds/roles";
import { seedDefaultSite } from "./seeds/site";
import { seedAdminUser } from "./seeds/admin-user";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🌱 Seeding NextPress database...\n");

  // Order matters: permissions → roles → site → admin user
  await seedPermissions(prisma);
  await seedRoles(prisma);
  const site = await seedDefaultSite(prisma);
  await seedAdminUser(prisma, site);

  console.log("\n✅ Seed complete.\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
