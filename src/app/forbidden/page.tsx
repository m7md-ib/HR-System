import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getServerDictionary } from "@/i18n/server";

export default async function ForbiddenPage() {
  const { dict } = await getServerDictionary();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert size={40} className="text-danger" />
      <h1 className="text-xl font-bold text-foreground">{dict.forbidden.title}</h1>
      <p className="max-w-sm text-sm text-muted">{dict.forbidden.body}</p>
      <Link href="/dashboard" className="text-sm font-medium text-primary underline underline-offset-4">
        {dict.forbidden.back}
      </Link>
    </div>
  );
}
