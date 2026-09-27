"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border p-16 text-center">
      <p className="text-sm font-semibold text-danger">حدث خطأ غير متوقع / An unexpected error occurred</p>
      <p className="max-w-md text-xs text-muted">{error.message}</p>
      <Button variant="secondary" size="sm" onClick={() => reset()}>
        إعادة المحاولة / Retry
      </Button>
    </div>
  );
}
