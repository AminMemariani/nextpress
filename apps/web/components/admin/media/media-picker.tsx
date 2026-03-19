"use client";

import { useState } from "react";
import { MediaGrid } from "./media-grid";
import { MediaUploader } from "./media-uploader";
import { Button } from "@nextpress/ui";
import type { MediaAssetDto } from "@nextpress/core/media/media-types";

interface Props {
  open: boolean;
  onSelect: (asset: MediaAssetDto) => void;
  onClose: () => void;
  accept?: string;
}

/**
 * Modal media picker — used by the content editor to select images
 * for featured image, image blocks, gallery blocks, etc.
 */
export function MediaPicker({ open, onSelect, onClose, accept }: Props) {
  const [tab, setTab] = useState<"library" | "upload">("library");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex gap-4">
            <button onClick={() => setTab("library")}
              className={`text-sm font-medium pb-1 ${tab === "library" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>
              Media Library
            </button>
            <button onClick={() => setTab("upload")}
              className={`text-sm font-medium pb-1 ${tab === "upload" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>
              Upload
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "library" ? (
            <MediaGrid
              selectionMode
              onSelect={(asset) => { onSelect(asset); onClose(); }}
            />
          ) : (
            <MediaUploader
              onUploadComplete={(asset) => { onSelect(asset); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
