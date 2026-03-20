import { requirePermission } from "@/lib/auth/guards";
import { PageHeader } from "@nextpress/ui";
import { PostEditorShell } from "@/components/admin/posts/post-editor-shell";

export default async function NewPostPage() {
  const auth = await requirePermission("create_content");

  return (
    <div>
      <PageHeader
        title="New Post"
        breadcrumbs={[{ label: "Posts", href: "/admin/posts" }, { label: "New" }]}
      />
      <PostEditorShell contentTypeSlug="post" canPublish={auth.permissions.has("publish_content")} />
    </div>
  );
}
