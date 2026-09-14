import { AlertTriangle } from "lucide-react";

export default function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="container-page max-w-lg py-20">
      <div className="card flex items-start gap-3 border-red-200 bg-red-50 p-5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
        <div>
          <p className="font-medium text-red-800">Couldn't load this page</p>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          <p className="mt-2 text-sm text-red-700">
            This usually means the Supabase URL/key isn't set correctly in your deployment, or the
            database schema hasn't been run yet. Check your Vercel Environment Variables and try again.
          </p>
        </div>
      </div>
    </div>
  );
}
