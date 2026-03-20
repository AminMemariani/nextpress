import type { PrismaClient } from "@prisma/client";
import { ROLE_DEFINITIONS, SUPER_ADMIN_ROLE } from "./seed-constants";

export async function seedRoles(prisma: PrismaClient) {
  console.log("Seeding roles...");

  const allRoles = [SUPER_ADMIN_ROLE, ...ROLE_DEFINITIONS];

  for (const roleDef of allRoles) {
    // Upsert the role
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        slug: roleDef.slug,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });

    // Link permissions (skip super_admin — it bypasses checks)
    if (roleDef.slug !== "super_admin" && roleDef.permissions.length > 0) {
      // Clear existing role-permission links and re-create
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      const permissions = await prisma.permission.findMany({
        where: { slug: { in: [...roleDef.permissions] } },
      });

      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log(`  ✓ ${allRoles.length} roles seeded with permissions`);
}
