import { requirePermission } from "@/lib/auth/guards";
import { PageHeader, Button } from "@nextpress/ui";

export default async function MediaPage() {
  await requirePermission("upload_media");

  return (
    <div>
      <PageHeader title="Media Library" actions={<Button>Upload</Button>} />
      <p className="text-gray-500">Media grid with filters, search, and bulk select. Upload via drag-drop or file picker.</p>
    </div>
  );
}
