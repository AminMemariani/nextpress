"use client";

import { useState, useCallback, useRef } from "react";
import { useToast, Button } from "@nextpress/ui";
import { trpc } from "@/lib/trpc/client";

interface Props {
  onUploadComplete?: (asset: any) => void;
}

export function MediaUploader({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const upload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProgress(`Uploading ${i + 1}/${fileArray.length}: ${file.name}`);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          toast("error", err.error ?? `Failed to upload ${file.name}`);
          continue;
        }
        const asset = await res.json();
        onUploadComplete?.(asset);
      } catch {
        toast("error", `Network error uploading ${file.name}`);
      }
    }

    setUploading(false);
    setProgress(null);
    utils.media.list.invalidate();
    toast("success", `${fileArray.length} file(s) uploaded`);
  }, [onUploadComplete, toast, utils]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,application/pdf,audio/*,video/*"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />

      {uploading ? (
        <p className="text-sm text-blue-600">{progress}</p>
      ) : (
        <>
          <p className="text-gray-500 mb-2">Drag files here or</p>
          <Button variant="outline" size="md" onClick={() => inputRef.current?.click()}>
            Choose Files
          </Button>
          <p className="text-xs text-gray-400 mt-2">Max 50MB per file</p>
        </>
      )}
    </div>
  );
}
