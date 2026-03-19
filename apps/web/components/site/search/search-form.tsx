"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialQuery?: string;
  placeholder?: string;
}

export function SearchForm({ initialQuery = "", placeholder = "Search..." }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" role="search">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="np-input flex-1"
        aria-label="Search"
        autoComplete="off"
      />
      <button type="submit" className="np-btn np-btn-primary np-btn-md">
        Search
      </button>
    </form>
  );
}
