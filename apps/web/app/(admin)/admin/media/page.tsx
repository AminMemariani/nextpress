import { requirePermission } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader } from "@nextpress/ui";
import { MediaUploader } from "@/components/admin/media/media-uploader";
import { MediaGrid } from "@/components/admin/media/media-grid";

export default async function MediaPage() {
  await requirePermission("upload_media");
  const caller = await getServerCaller();
  const initialData = await caller.media.list({ page: 1, perPage: 24 });

  return (
    <div className="space-y-6">
      <PageHeader title="Media Library" />
      <MediaUploader />
      <MediaGrid initialData={initialData} />
    </div>
  );
}
