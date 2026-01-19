"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SidebarProvider>
        <AuthProvider>{children}</AuthProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
