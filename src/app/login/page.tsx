import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { LoginForm } from "./login-form";
import { LanguageSwitch } from "@/components/shell/language-switch";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { dict } = await getServerDictionary();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitch />
      </div>
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-primary text-lg font-bold text-primary-foreground">
            M
          </div>
          <h1 className="text-lg font-bold text-foreground">{dict.auth.loginTitle}</h1>
          <p className="mt-1 text-xs text-muted">{dict.auth.loginSubtitle}</p>
        </div>
        <LoginForm />
        <div className="mt-6 rounded-[var(--radius-md)] bg-muted-surface p-3 text-[11px] leading-5 text-muted">
          <p className="mb-1 font-semibold text-foreground">{dict.auth.demoAccountsHint}</p>
          <p>admin@mayshr.com — Admin@12345</p>
          <p>hr.manager@mayshr.com — Hr@123456</p>
          <p>accountant@mayshr.com — Acc@123456</p>
        </div>
      </div>
    </div>
  );
}
