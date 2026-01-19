"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getPartnerCustomers } from "@/lib/api/partner";
import type { PartnerCustomer } from "@/types/partner";

export default function CustomersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<PartnerCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const q: Record<string, string> = {};
    if (limit) q.limit = String(limit);
    return q;
  }, [limit]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getPartnerCustomers(token, query);
        if (active) setItems(res.items || []);
      } catch {
        if (active) setError("Falha ao carregar clientes");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Clientes</h1>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Limite</label>
            <input
              type="number"
              min="10"
              max="200"
              step="10"
              value={limit}
              onChange={(e) => setLimit(Math.max(10, Math.min(200, Number(e.target.value))))}
              className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark dark:text-white">Listagem</h2>
          <div className="text-sm text-dark-5 dark:text-dark-6">{loading ? "Carregando..." : `${items.length} clientes`}</div>
        </div>
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr className="bg-gray-2 dark:bg-dark-3">
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Email</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-dark dark:text-white">Compras</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Última compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((c) => (
                <tr key={c.customer_email}>
                  <td className="px-4 py-3 text-sm">{c.customer_name || "-"}</td>
                  <td className="px-4 py-3 text-sm">{c.customer_email}</td>
                  <td className="px-4 py-3 text-right text-sm">{c.purchases}</td>
                  <td className="px-4 py-3 text-sm">{new Date(c.last_purchase_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-dark-5 dark:text-dark-6" colSpan={4}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
