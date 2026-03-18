import { requireAdmin } from "@/lib/auth/guards";
import { checkPermissions } from "@/lib/permissions/check";

/**
 * Posts list page.
 *
 * - All admin users can see the list (requireAdmin gate)
 * - Create button shown only if user has create_content permission
 * - Publish actions shown only if user has publish_content permission
 */
export default async function PostsPage() {
  const auth = await requireAdmin();

  const perms = await checkPermissions([
    "create_content",
    "publish_content",
    "edit_others_content",
    "delete_others_content",
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        {perms.create_content && (
          <a
            href="/admin/posts/new"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            New Post
          </a>
        )}
      </div>

      {/* Post list table would go here */}
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Your permissions: {perms.edit_others_content ? "Can edit all posts" : "Can edit own posts only"}
          {perms.publish_content && " | Can publish"}
          {perms.delete_others_content && " | Can delete all posts"}
        </p>
      </div>
    </div>
  );
}
