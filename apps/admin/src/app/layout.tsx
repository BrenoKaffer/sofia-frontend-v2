import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import AuthGuard from "@/components/Auth/AuthGuard";
import { APP_NAME } from "@/lib/config";
import NextTopLoader from "nextjs-toploader";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";

export const metadata: Metadata = {
  title: {
    template: "%s | " + APP_NAME,
    default: APP_NAME,
  },
  description: "Portal do Parceiro SOFIA para gestão de vendas, checkout e financeiro.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
              <Header />
              <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
                <AuthGuard>{children}</AuthGuard>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
