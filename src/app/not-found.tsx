import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="rounded-2xl bg-white p-8 border border-slate-200/80 shadow-sm max-w-md w-full space-y-4">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-700 font-bold text-xl">
          404
        </div>
        <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
        <p className="text-xs text-slate-500">
          The page or document you are trying to access does not exist or was moved.
        </p>
        <Link href="/dashboard" className="block pt-2">
          <Button className="w-full">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
