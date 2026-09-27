import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";

export default async function MyProfilePage() {
  const user = await requireUser();
  if (user.employeeId) {
    redirect(`/employees/${user.employeeId}`);
  }
  const { dict } = await getServerDictionary();
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-center">
      <p className="text-sm text-muted">{dict.common.noData}</p>
    </div>
  );
}
