import type { PrismaClient } from "@prisma/client";
import { PERMISSION_DEFINITIONS } from "@nextpress/core/auth/auth-config";

export async function seedPermissions(prisma: PrismaClient) {
  console.log("Seeding permissions...");

  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: { name: perm.name, group: perm.group },
      create: {
        slug: perm.slug,
        name: perm.name,
        group: perm.group,
        description: `Allows user to: ${perm.name.toLowerCase()}`,
      },
    });
  }

  console.log(`  ✓ ${PERMISSION_DEFINITIONS.length} permissions seeded`);
}
