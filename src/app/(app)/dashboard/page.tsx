import { getServerDictionary } from "@/i18n/server";

export default async function DashboardPage() {
  const { dict } = await getServerDictionary();
  return <div className="text-sm text-muted">{dict.nav.dashboard}</div>;
}
