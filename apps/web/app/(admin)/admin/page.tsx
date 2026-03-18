import { requireAdmin } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader, StatCard } from "@nextpress/ui";
import { prisma } from "@nextpress/db";

export default async function DashboardPage() {
  const auth = await requireAdmin();

  const [contentCount, commentCount, userCount] = await Promise.all([
    prisma.contentEntry.count({ where: { siteId: auth.siteId } }),
    prisma.comment.count({ where: { siteId: auth.siteId, status: "PENDING" } }),
    prisma.userSite.count({ where: { siteId: auth.siteId } }),
  ]);

  const recentEntries = await prisma.contentEntry.findMany({
    where: { siteId: auth.siteId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, status: true, updatedAt: true, contentType: { select: { slug: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${auth.user.displayName ?? auth.user.name ?? auth.user.email}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Content" value={contentCount} />
        <StatCard label="Pending Comments" value={commentCount} />
        <StatCard label="Users" value={userCount} />
      </div>

      <h2 className="text-lg font-semibold mb-3">Recently Updated</h2>
      <div className="bg-white rounded-lg border divide-y">
        {recentEntries.map((entry) => (
          <a
            key={entry.id}
            href={`/admin/${entry.contentType.slug === "post" ? "posts" : entry.contentType.slug}/${entry.id}/edit`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">{entry.title}</span>
            <span className="text-xs text-gray-400">
              {entry.status.toLowerCase()} · {new Date(entry.updatedAt).toLocaleDateString()}
            </span>
          </a>
        ))}
        {recentEntries.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400">No content yet</p>
        )}
      </div>
    </div>
  );
}
