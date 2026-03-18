import { requirePermission } from "@/lib/auth/guards";
import { PageHeader } from "@nextpress/ui";
import { prisma } from "@nextpress/db";

export default async function TaxonomiesPage() {
  const auth = await requirePermission("manage_taxonomies");
  const taxonomies = await prisma.taxonomy.findMany({
    where: { siteId: auth.siteId },
    include: { _count: { select: { terms: true } } },
    orderBy: { slug: "asc" },
  });

  return (
    <div>
      <PageHeader title="Taxonomies" description="Manage categories, tags, and custom taxonomies" />
      <div className="bg-white rounded-lg border divide-y">
        {taxonomies.map((t) => (
          <a key={t.id} href={`/admin/taxonomies/${t.slug}/terms`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-400">{t.slug} · {t._count.terms} terms · {t.hierarchical ? "hierarchical" : "flat"}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
