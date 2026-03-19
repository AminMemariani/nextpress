import { requirePermission } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader } from "@nextpress/ui";

/**
 * Taxonomies page — uses tRPC, not direct Prisma.
 * TODO: Add taxonomy.list router when taxonomy router is implemented.
 * For now, use a dedicated server caller method.
 */
export default async function TaxonomiesPage() {
  await requirePermission("manage_taxonomies");
  const caller = await getServerCaller();

  // Taxonomy listing should go through a tRPC router.
  // Placeholder: content types list shows taxonomy-related info.
  const contentTypes = await caller.contentType.list();

  return (
    <div>
      <PageHeader title="Taxonomies" description="Manage categories, tags, and custom taxonomies" />
      <p className="text-sm text-gray-500 mb-4">
        Taxonomy management UI will be connected when the taxonomy tRPC router is implemented.
      </p>
      <div className="bg-white rounded-lg border divide-y">
        {contentTypes.map((ct) => (
          <div key={ct.id} className="px-4 py-3">
            <div className="font-medium">{ct.namePlural}</div>
            <div className="text-xs text-gray-400">{ct.slug} · {ct.entryCount} entries</div>
          </div>
        ))}
      </div>
    </div>
  );
}
