"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Dropdown, DropdownContent, DropdownTrigger, DropdownClose } from "@/components/ui/dropdown";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

function Avatar({ name }: { name?: string | null }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="grid size-12 place-items-center overflow-hidden rounded-full border bg-gray-2 text-dark dark:border-dark-4 dark:bg-dark-3 dark:text-white">
      <span className="text-lg font-semibold">{initial}</span>
    </div>
  );
}

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { partner, logout } = useAuth();
  const displayName = String(partner?.name || "").trim() || "—";
  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="flex items-center gap-3 rounded-full border bg-gray-2 px-2 py-1 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary">
        <Avatar name={partner?.name} />
        <div className="hidden text-left sm:block">
          <strong className="block text-sm font-semibold text-dark dark:text-white">
            {displayName}
          </strong>
          <span className="text-xs text-dark-5 dark:text-dark-6">{partner?.ref_code || "—"}</span>
        </div>
      </DropdownTrigger>
      <DropdownContent align="end" className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[250px]:min-w-[16rem]">
        <div className="mb-2 flex items-center gap-3 px-2">
          <Avatar name={partner?.name} />
          <div>
            <strong className="block text-sm font-semibold text-dark dark:text-white">
              {displayName}
            </strong>
            <span className="text-xs text-dark-5 dark:text-dark-6">{partner?.ref_code || "—"}</span>
          </div>
        </div>
        <ul className="mb-2 space-y-1.5">
          <li>
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className={cn(
                "block rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
              )}
            >
              Meu perfil
            </Link>
          </li>
        </ul>
        <DropdownClose>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="block w-full rounded-lg border border-red-light p-2 text-center text-sm font-medium tracking-wide text-red-light outline-none transition-colors hover:bg-red-light/10 focus:bg-red-light/10 dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
          >
            Sair
          </button>
        </DropdownClose>
      </DropdownContent>
    </Dropdown>
  );
}
