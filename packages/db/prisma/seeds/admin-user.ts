import type { PrismaClient, Site } from "@prisma/client";
import { hash } from "bcryptjs";
import { BCRYPT_ROUNDS } from "@nextpress/core/auth/auth-config";

export async function seedAdminUser(prisma: PrismaClient, site: Site) {
  console.log("Seeding admin user...");

  const email = process.env.ADMIN_EMAIL ?? "admin@nextpress.local";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123!";

  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Admin",
      displayName: "Site Administrator",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  // Find or create admin role
  const adminRole = await prisma.role.findUnique({
    where: { slug: "admin" },
  });

  if (!adminRole) {
    throw new Error("Admin role not found. Run seedRoles first.");
  }

  // Link user to site with admin role
  await prisma.userSite.upsert({
    where: {
      userId_siteId: { userId: user.id, siteId: site.id },
    },
    update: { roleId: adminRole.id },
    create: {
      userId: user.id,
      siteId: site.id,
      roleId: adminRole.id,
    },
  });

  console.log(`  ✓ Admin user created: ${email}`);
  if (password === "changeme123!") {
    console.log(
      "  ⚠ Using default password. Set ADMIN_PASSWORD env var in production.",
    );
  }
}
