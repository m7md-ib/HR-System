import { requirePermission } from "@/lib/auth/current-user";
import { getServerDictionary } from "@/i18n/server";
import { getSettings } from "@/lib/queries/attendance";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requirePermission("settings", "view");
  const { dict } = await getServerDictionary();
  const settings = await getSettings();

  return (
    <div>
      <PageHeader title={dict.settings.title} description={dict.settings.subtitle} />
      <SettingsForm settings={{ ...settings, overtimeMultiplier: settings.overtimeMultiplier.toString() }} />
    </div>
  );
}
