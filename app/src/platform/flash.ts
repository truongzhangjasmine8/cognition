import { redirect } from "next/navigation";

// Server actions run `fn`, then redirect back with a message in the query
// string so pages can render a success or error banner.
export async function withFlash(path: string, fn: () => Promise<string>): Promise<never> {
  let target: string;
  try {
    const ok = await fn();
    target = `${path}?ok=${encodeURIComponent(ok)}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    target = `${path}?error=${encodeURIComponent(message)}`;
  }
  redirect(target);
}

export type Flash = { ok?: string; error?: string };

export function readFlash(sp: Record<string, string | string[] | undefined>): Flash {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return { ok: one(sp.ok), error: one(sp.error) };
}
