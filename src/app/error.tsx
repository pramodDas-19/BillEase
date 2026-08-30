"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="rounded-2xl bg-white p-8 border border-rose-100 shadow-sm max-w-md w-full space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600 font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="text-xs text-slate-500">
          An unexpected error occurred while processing your request.
        </p>
        <Button onClick={() => reset()} className="w-full">
          Try Again
        </Button>
      </div>
    </div>
  );
}
