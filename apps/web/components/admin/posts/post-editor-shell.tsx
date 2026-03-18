"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NextPressEditor } from "@nextpress/editor";
import { trpc } from "@/lib/trpc/client";
import { useToast, Button } from "@nextpress/ui";
import { useAutosave } from "@/hooks/use-autosave";
import { StatusControls } from "./status-controls";
import type { BlockData } from "@nextpress/blocks";

interface Props {
  contentTypeSlug: string;
  entryId?: string;
  initialData?: {
    title: string;
    slug: string;
    blocks: BlockData[];
    status: string;
    excerpt: string | null;
  };
}

export function PostEditorShell({ contentTypeSlug, entryId, initialData }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [blocks, setBlocks] = useState<BlockData[]>(initialData?.blocks ?? []);
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [isDirty, setIsDirty] = useState(false);

  const createMutation = trpc.content.create.useMutation();
  const updateMutation = trpc.content.update.useMutation();
  const publishMutation = trpc.content.publish.useMutation();
  const trashMutation = trpc.content.trash.useMutation();

  const save = useCallback(async () => {
    try {
      if (entryId) {
        await updateMutation.mutateAsync({
          id: entryId,
          data: { title, blocks },
        });
        toast("success", "Saved");
      } else {
        const result = await createMutation.mutateAsync({
          contentTypeSlug,
          title,
          blocks,
          status: "DRAFT",
        });
        toast("success", "Draft created");
        router.push(`/admin/posts/${result.id}/edit`);
      }
      setIsDirty(false);
    } catch (e: any) {
      toast("error", e.message ?? "Save failed");
    }
  }, [entryId, title, blocks, contentTypeSlug, updateMutation, createMutation, toast, router]);

  const handlePublish = useCallback(async () => {
    if (!entryId) {
      await save();
      return;
    }
    try {
      await publishMutation.mutateAsync({ id: entryId });
      setStatus("PUBLISHED");
      toast("success", "Published");
    } catch (e: any) {
      toast("error", e.message ?? "Publish failed");
    }
  }, [entryId, publishMutation, save, toast]);

  // Autosave every 30 seconds when dirty
  useAutosave(isDirty && !!entryId, save, 30_000);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Main editor area */}
      <div className="space-y-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
          placeholder="Enter title..."
          className="w-full text-3xl font-bold border-0 outline-none bg-transparent placeholder:text-gray-300"
          autoFocus
        />

        {/* Block editor */}
        <div className="bg-white rounded-lg border min-h-[400px]">
          <NextPressEditor
            initialBlocks={blocks}
            onChange={(newBlocks) => { setBlocks(newBlocks); setIsDirty(true); }}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <StatusControls
          status={status}
          isDirty={isDirty}
          isSaving={isSaving}
          onSave={save}
          onPublish={handlePublish}
          onTrash={entryId ? async () => {
            await trashMutation.mutateAsync({ id: entryId });
            router.push(`/admin/posts`);
          } : undefined}
        />
      </div>
    </div>
  );
}
