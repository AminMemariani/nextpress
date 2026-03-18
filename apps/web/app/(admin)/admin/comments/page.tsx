import { requirePermission } from "@/lib/auth/guards";
import { PageHeader } from "@nextpress/ui";

export default async function CommentsPage() {
  await requirePermission("moderate_comments");

  return (
    <div>
      <PageHeader title="Comments" description="Moderate, approve, or trash comments" />
      <p className="text-gray-500">Filterable comment list with status tabs (Pending, Approved, Spam, Trash) and bulk actions.</p>
    </div>
  );
}
