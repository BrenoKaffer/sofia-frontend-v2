"use client";
import { useAuth } from "@/contexts/auth-context";
import PartnerKpis from "./(home)/_components/partner-kpis";

export default function Page() {
  const { partner } = useAuth();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark dark:text-white">Olá, {partner?.name || "Parceiro"}</h2>
      <PartnerKpis />
    </div>
  );
}

