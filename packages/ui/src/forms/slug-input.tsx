"use client";

import { useState, useEffect } from "react";

interface SlugInputProps {
  value: string;
  onChange: (slug: string) => void;
  autoFrom?: string;
  prefix?: string;
  error?: string;
}

export function SlugInput({ value, onChange, autoFrom, prefix = "/", error }: SlugInputProps) {
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!manual && autoFrom) {
      const slug = autoFrom
        .toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      onChange(slug);
    }
  }, [autoFrom, manual, onChange]);

  return (
    <div className="np-slug-input">
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-400">{prefix}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => { setManual(true); onChange(e.target.value); }}
          className={`np-input flex-1 ${error ? "np-input-error" : ""}`}
          placeholder="url-slug"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
