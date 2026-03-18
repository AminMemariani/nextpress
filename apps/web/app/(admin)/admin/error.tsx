"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-gray-500">{error.message || "An unexpected error occurred"}</p>
      <button onClick={reset} className="mt-4 np-btn np-btn-primary np-btn-md">Try again</button>
    </div>
  );
}
