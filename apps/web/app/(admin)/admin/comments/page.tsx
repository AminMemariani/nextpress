import { requirePermission } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader } from "@nextpress/ui";
import { CommentList } from "@/components/admin/comments/comment-list";

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const auth = await requirePermission("moderate_comments");
  const params = await searchParams;
  const status = params.status as any;
  const page = parseInt(params.page ?? "1", 10);

  const caller = await getServerCaller();
  const [data, counts] = await Promise.all([
    caller.comment.list({ status, page, perPage: 20 }),
    caller.comment.countByStatus(),
  ]);

  return (
    <div>
      <PageHeader
        title="Comments"
        description={`${counts.PENDING} pending moderation`}
      />
      <CommentList
        initialData={data}
        currentStatus={status}
        counts={counts}
      />
    </div>
  );
}
