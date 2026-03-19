import { requireAdmin } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader, StatCard } from "@nextpress/ui";

/**
 * Dashboard — no direct Prisma imports.
 * All data flows through tRPC → service layer → Prisma.
 */
export default async function DashboardPage() {
  const auth = await requireAdmin();
  const caller = await getServerCaller();

  // Dashboard stats and recent entries via tRPC
  const [contentTypes, recentPosts, commentCounts] = await Promise.all([
    caller.contentType.list(),
    caller.content.list({ contentTypeSlug: "post", page: 1, perPage: 5, sortBy: "updatedAt" }),
    caller.comment.countByStatus(),
  ]);

  const totalContent = contentTypes.reduce((sum, ct) => sum + ct.entryCount, 0);
  const pendingComments = commentCounts.PENDING;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${auth.user.displayName ?? auth.user.name ?? auth.user.email}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Content" value={totalContent} />
        <StatCard label="Pending Comments" value={pendingComments} />
        <StatCard label="Content Types" value={contentTypes.length} />
      </div>

      <h2 className="text-lg font-semibold mb-3">Recently Updated</h2>
      <div className="bg-white rounded-lg border divide-y">
        {recentPosts.items.map((entry) => (
          <a
            key={entry.id}
            href={`/admin/${entry.contentTypeSlug === "post" ? "posts" : entry.contentTypeSlug}/${entry.id}/edit`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">{entry.title}</span>
            <span className="text-xs text-gray-400">
              {entry.status.toLowerCase()} · {new Date(entry.updatedAt).toLocaleDateString()}
            </span>
          </a>
        ))}
        {recentPosts.items.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400">No content yet</p>
        )}
      </div>
    </div>
  );
}
