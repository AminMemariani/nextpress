import { requireAdmin } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader } from "@nextpress/ui";
import { PostEditorShell } from "@/components/admin/posts/post-editor-shell";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  const { id } = await params;
  const caller = await getServerCaller();
  const entry = await caller.content.getById({ id });

  return (
    <div>
      <PageHeader
        title={`Edit: ${entry.title}`}
        breadcrumbs={[{ label: "Posts", href: "/admin/posts" }, { label: entry.title }]}
      />
      <PostEditorShell contentTypeSlug="post" entryId={id} canPublish={auth.permissions.has("publish_content")} initialData={entry} />
    </div>
  );
}
