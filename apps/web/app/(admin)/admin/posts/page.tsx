import { requireAdmin } from "@/lib/auth/guards";
import { checkPermissions } from "@/lib/permissions/check";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader, Button } from "@nextpress/ui";
import { PostListTable } from "@/components/admin/posts/post-list-table";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const auth = await requireAdmin();
  const params = await searchParams;
  const perms = await checkPermissions(["create_content", "publish_content", "edit_others_content", "delete_others_content"]);

  const page = parseInt(params.page ?? "1", 10);
  const status = params.status as any;
  const search = params.search;

  const caller = await getServerCaller();
  const result = await caller.content.list({
    contentTypeSlug: "post",
    page,
    perPage: 20,
    status,
    search,
  });

  return (
    <div>
      <PageHeader
        title="Posts"
        actions={
          perms.create_content ? (
            <Button variant="primary" size="md">
              <a href="/admin/posts/new">New Post</a>
            </Button>
          ) : undefined
        }
      />

      <PostListTable
        entries={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        permissions={perms}
        currentStatus={status}
        currentSearch={search}
        baseUrl="/admin/posts"
      />
    </div>
  );
}
