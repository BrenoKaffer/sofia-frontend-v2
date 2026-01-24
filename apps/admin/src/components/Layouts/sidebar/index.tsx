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
  const { isOpen, setIsOpen, isMobile, toggleSidebar } = useSidebarContext();
  if (pathname.startsWith("/auth")) return null;
  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Navegação principal"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link href={"/dashboard"} onClick={() => isMobile && toggleSidebar()} className="px-0 py-2.5 min-[850px]:py-0">
              <div className="flex h-12 items-center">
                <div className="rounded-[5px] bg-black p-1">
                  <img src="/logo_sofia.png" alt="SOFIA" className="h-8 w-auto" />
                </div>
              </div>
            </Link>
          </div>
          <nav className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10" role="navigation" aria-label="Menu">
            <div className="mb-3 px-3 text-xs font-semibold tracking-wide text-dark-5 dark:text-dark-6">MAIN MENU</div>
            <ul className="space-y-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-dark outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:text-white dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
                      pathname === item.href && "bg-blue-light-5 text-primary dark:bg-primary/10 dark:text-primary",
                    )}
                  >
                    <item.Icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-primary" : "text-dark-5 dark:text-dark-6")} />
                    <span>{item.title}</span>
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
