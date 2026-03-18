"use client";

import { Button } from "@nextpress/ui";

interface Props {
  status: string;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onTrash?: () => Promise<void>;
}

export function StatusControls({ status, isDirty, isSaving, onSave, onPublish, onTrash }: Props) {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Publish</h3>

      <div className="text-sm text-gray-500">
        Status: <span className="font-medium">{status.replace("_", " ").toLowerCase()}</span>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="md"
          onClick={onSave}
          loading={isSaving}
          disabled={!isDirty}
        >
          Save Draft
        </Button>

        {status !== "PUBLISHED" && (
          <Button variant="primary" size="md" onClick={onPublish}>
            Publish
          </Button>
        )}

        {status === "PUBLISHED" && isDirty && (
          <Button variant="primary" size="md" onClick={onSave} loading={isSaving}>
            Update
          </Button>
        )}
      </div>

      {onTrash && (
        <button
          onClick={onTrash}
          className="text-xs text-red-500 hover:text-red-700 mt-2"
        >
          Move to Trash
        </button>
      )}
    </div>
  );
}
