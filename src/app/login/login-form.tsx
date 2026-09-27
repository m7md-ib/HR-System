"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

const initialState: LoginState = {};

export function LoginForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label={dict.auth.email} htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="admin@mayshr.com" />
      </Field>
      <Field label={dict.auth.password} htmlFor="password" required>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      {state?.error && (
        <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-xs text-danger">
          {dict.auth.invalidCredentials}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? dict.auth.loggingIn : dict.auth.loginButton}
      </Button>
    </form>
  );
}
