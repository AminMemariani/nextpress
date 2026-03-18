"use client";

import { useState, useCallback } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description, confirmLabel = "Confirm",
  cancelLabel = "Cancel", variant = "default", onConfirm, onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  }, [onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="np-btn np-btn-outline np-btn-md" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`np-btn np-btn-md ${variant === "danger" ? "np-btn-danger" : "np-btn-primary"}`}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
