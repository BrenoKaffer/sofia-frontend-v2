"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "./sidebar-context";
import { DashboardIcon, LinkIcon, ShoppingBagIcon, UsersIcon, WalletIcon } from "../header/icons";

const NAV = [
  { title: "Dashboard", href: "/dashboard", Icon: DashboardIcon },
  { title: "Links", href: "/links", Icon: LinkIcon },
  { title: "Financeiro", href: "/finance", Icon: WalletIcon },
  { title: "Vendas", href: "/sales", Icon: ShoppingBagIcon },
  { title: "Clientes", href: "/customers", Icon: UsersIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state, isMobileOpen, setIsMobileOpen, isMobile, toggleMobile, toggleCollapse } = useSidebarContext();
  if (pathname.startsWith("/auth")) return null;
  const isCollapsed = !isMobile && state === "collapsed";
  const shouldHide = isMobile && !isMobileOpen;
  return (
    <>
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isMobile ? (isMobileOpen ? "w-full max-w-[290px]" : "w-0") : isCollapsed ? "w-[88px]" : "w-[290px]",
        )}
        aria-label="Navegação principal"
        aria-hidden={shouldHide}
        inert={shouldHide}
      >
        <div className={cn("flex h-full flex-col py-10", isCollapsed ? "px-3" : "px-4")}>
          <div className={cn("relative flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            <Link
              href={"/dashboard"}
              onClick={() => isMobile && toggleMobile()}
              className="flex items-center justify-center py-2.5 min-[850px]:py-0"
            >
              <img
                src={isCollapsed ? "/favicon.svg" : "/logo_sofia_claro.png"}
                alt="SOFIA"
                className={cn(isCollapsed ? "h-10 w-10" : "h-12 w-auto")}
              />
            </Link>
            {!isMobile && (
              <button
                type="button"
                onClick={toggleCollapse}
                className={cn(
                  "grid size-9 place-items-center rounded-lg border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary",
                  isCollapsed ? "absolute right-0 top-1/2 -translate-y-1/2" : "",
                )}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={cn("transition-transform", isCollapsed ? "rotate-180" : "rotate-0")}
                  aria-hidden="true"
                >
                  <path
                    d="M15 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="sr-only">{isCollapsed ? "Expandir menu" : "Colapsar menu"}</span>
              </button>
            )}
          </div>
          <nav
            className={cn("custom-scrollbar mt-6 flex-1 overflow-y-auto min-[850px]:mt-10", isCollapsed ? "pr-0" : "pr-3")}
            role="navigation"
            aria-label="Menu"
          >
            {!isCollapsed && (
              <div className="mb-3 px-3 text-xs font-semibold tracking-wide text-dark-5 dark:text-dark-6">MAIN MENU</div>
            )}
            <ul className="space-y-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={isCollapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-3 text-dark outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:text-white dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
                      isCollapsed ? "justify-center" : "gap-3",
                      pathname === item.href && "bg-blue-light-5 text-primary dark:bg-primary/10 dark:text-primary",
                    )}
                  >
                    <item.Icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-primary" : "text-dark-5 dark:text-dark-6")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
