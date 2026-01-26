"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon, MenuIcon } from "./icons";
import { Notification } from "./notification";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { UserInfo } from "./user-info";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const { toggleMobile, isMobile } = useSidebarContext();
  const pathname = usePathname();
  const { partner } = useAuth();
  if (pathname.startsWith("/auth")) return null;

  const firstName = (partner?.name || "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean)[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleMobile}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">Alternar Sidebar</span>
      </button>
      {isMobile && (
        <Link href={"/"} className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
          <div className="rounded-[5px] bg-black p-1">
            <img src="/logo_sofia.png" alt="SOFIA" className="h-6 w-auto" />
          </div>
        </Link>
      )}
      <div className="hidden md:block">
        <div className="text-sm font-semibold text-dark dark:text-white">
          {firstName ? `Olá, ${firstName}!` : "Olá!"} Bem-vindo(a) ao portal do parceiro SOFIA.
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Pesquisar"
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />
          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div>
        <Notification />
        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
