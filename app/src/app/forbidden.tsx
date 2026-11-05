export default function Forbidden() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="font-semibold text-amber-900">You don&apos;t have access to this tool</h2>
      <p className="mt-2 text-sm text-amber-800">Your role doesn&apos;t include the required permission. Switch demo user in the sidebar to try another role.</p>
    </div>
  );
}
