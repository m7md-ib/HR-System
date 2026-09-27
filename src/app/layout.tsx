import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getServerDictionary } from "@/i18n/server";
import { dirFor } from "@/i18n/config";
import { I18nProvider } from "@/i18n/provider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MAYS HR",
  description: "MAYS HR — Complete HR Management & Payroll System",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getServerDictionary();

  return (
    <html lang={locale} dir={dirFor(locale)} className={cairo.variable}>
      <body className="min-h-screen antialiased">
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
