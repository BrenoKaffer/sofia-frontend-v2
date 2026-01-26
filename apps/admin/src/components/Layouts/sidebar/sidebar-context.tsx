"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { createContext, useContext, useEffect, useState } from "react";

type SidebarState = "expanded" | "collapsed";
type SidebarContextType = {
  state: SidebarState;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleMobile: () => void;
  toggleCollapse: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(defaultOpen);
  const [state, setState] = useState<SidebarState>("expanded");
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-state");
    if (saved === "collapsed" || saved === "expanded") setState(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-state", state);
  }, [state]);

  function toggleMobile() {
    setIsMobileOpen((prev) => !prev);
  }

  function toggleCollapse() {
    setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  }

  return (
    <SidebarContext.Provider
      value={{
        state,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
        toggleMobile,
        toggleCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
