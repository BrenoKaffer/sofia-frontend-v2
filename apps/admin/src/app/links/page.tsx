"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getPartnerLinks } from "@/lib/api/partner";
import type { PartnerLink } from "@/types/partner";

export default function LinksPage() {
  const { token, partner } = useAuth();
  const [items, setItems] = useState<PartnerLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      setMessage(null);
      try {
        const res = await getPartnerLinks(token);
        if (active) setItems(res.items || []);
      } catch {
        if (active) setMessage("Falha ao carregar links");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Link copiado para a área de transferência");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("Falha ao copiar o link");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Meus Links</h1>
        <p className="mt-2 text-dark-5 dark:text-dark-6">Parceiro: {partner?.name || "-"}</p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark dark:text-white">Links de Checkout</h2>
          <div className="text-sm text-dark-5 dark:text-dark-6">{loading ? "Carregando..." : `${items.length} links`}</div>
        </div>
        {message && <div className="mt-2 text-sm">{message}</div>}
        <div className="mt-4 space-y-3">
          {items.map((l, idx) => (
            <div key={`${l.url}-${idx}`} className="flex items-center justify-between rounded-lg border bg-gray-2 p-3 dark:border-dark-3 dark:bg-dark-2">
              <div className="min-w-0">
                <div className="truncate text-sm text-dark dark:text-white">{l.url}</div>
                {l.label && <div className="text-xs text-dark-5 dark:text-dark-6">{l.label}</div>}
              </div>
              <button onClick={() => copy(l.url)} className="ml-3 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">Copiar</button>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <div className="rounded-lg border bg-gray-2 p-6 text-center text-sm text-dark-5 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
              <div>Nenhum link disponível.</div>
              <div className="mt-3">
                <Link href="/parceiro/cadastro" className="inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-white">
                  Completar cadastro de parceiro
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
