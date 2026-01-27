"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE_URL } from "@/lib/config";
import { getPartnerTableLinks, updatePartnerTableLinks } from "@/lib/api/partner";

type TableOption = { id: string; name: string };

export default function MesasPage() {
  const { token, partner } = useAuth();
  const [tables, setTables] = useState<TableOption[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [affiliateSlug, setAffiliateSlug] = useState<string | null>(null);
  const [needsAffiliateSetup, setNeedsAffiliateSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => a.name.localeCompare(b.name));
  }, [tables]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      setMessage(null);
      try {
        const [optsRes, linksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/available-options`, { cache: "no-store" }).then((r) => r.json().catch(() => null)),
          getPartnerTableLinks(token),
        ]);

        const tableOptions: TableOption[] = Array.isArray(optsRes?.tables)
          ? optsRes.tables
              .map((t: any) => ({ id: String(t?.id || "").trim(), name: String(t?.name || "").trim() }))
              .filter((t: TableOption) => t.id && t.name)
          : [];

        const nextValues: Record<string, string> = {};
        (linksRes.items || []).forEach((row) => {
          const tableId = String(row?.table_id || "").trim();
          const url = String(row?.iframe_url || "").trim();
          if (tableId && url) nextValues[tableId] = url;
        });

        if (active) {
          setTables(tableOptions);
          setValues((prev) => ({ ...prev, ...nextValues }));
          setAffiliateSlug(linksRes.affiliate_slug ? String(linksRes.affiliate_slug) : null);
          setNeedsAffiliateSetup(Boolean(linksRes.needs_affiliate_setup));
        }
      } catch {
        if (active) setMessage("Falha ao carregar dados");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const items = sortedTables
        .map((t) => ({
          table_id: t.id,
          iframe_url: String(values[t.id] || "").trim(),
        }))
        .filter((row) => row.table_id && row.iframe_url);

      const res = await updatePartnerTableLinks(token, items);
      setAffiliateSlug(res.affiliate_slug ? String(res.affiliate_slug) : null);
      setNeedsAffiliateSetup(Boolean(res.needs_affiliate_setup));
      setMessage("Links salvos com sucesso");
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setMessage(msg ? `Falha ao salvar: ${msg}` : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Mesas</h1>
            <p className="mt-2 text-dark-5 dark:text-dark-6">Parceiro: {partner?.name || "-"}</p>
            <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">Slug do afiliado: {affiliateSlug || "-"}</p>
          </div>
          <button
            onClick={save}
            disabled={loading || saving || !sortedTables.length || needsAffiliateSetup}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
        {message && <div className="mt-3 text-sm text-dark dark:text-white">{message}</div>}
        {needsAffiliateSetup && (
          <div className="mt-3 rounded-lg border bg-gray-2 p-4 text-sm text-dark-5 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
            Seu cadastro de afiliado ainda não está ativo. Finalize o cadastro para liberar os links das mesas.
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark dark:text-white">Links por mesa</h2>
          <div className="text-sm text-dark-5 dark:text-dark-6">
            {loading ? "Carregando..." : `${sortedTables.length} mesas`}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {sortedTables.map((t) => (
            <div key={t.id} className="rounded-lg border bg-gray-2 p-4 dark:border-dark-3 dark:bg-dark-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-dark dark:text-white">{t.name}</div>
                  <div className="mt-1 text-xs text-dark-5 dark:text-dark-6">{t.id}</div>
                </div>
                <div className="w-full sm:max-w-[560px]">
                  <input
                    value={values[t.id] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    placeholder="Cole aqui a URL do iframe desta mesa"
                    className="w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-dark-3 dark:bg-gray-dark"
                    disabled={needsAffiliateSetup}
                  />
                </div>
              </div>
            </div>
          ))}

          {!loading && sortedTables.length === 0 && (
            <div className="rounded-lg border bg-gray-2 p-6 text-center text-sm text-dark-5 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
              Nenhuma mesa disponível.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

