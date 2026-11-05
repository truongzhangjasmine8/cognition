"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h2 className="font-semibold text-rose-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-rose-800">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm">
        Try again
      </button>
    </div>
  );
}
