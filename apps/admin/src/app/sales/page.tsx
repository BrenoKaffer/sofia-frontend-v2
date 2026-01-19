"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getPartnerSales, getPartnerSaleById } from "@/lib/api/partner";
import type { PartnerSale, PartnerSaleDetail } from "@/types/partner";
 
 export default function SalesPage() {
   const { token } = useAuth();
   const [items, setItems] = useState<PartnerSale[]>([]);
   const [loading, setLoading] = useState(false);
   const [status, setStatus] = useState<string>("");
   const [limit, setLimit] = useState<number>(50);
   const [error, setError] = useState<string | null>(null);
   const [nextCursor, setNextCursor] = useState<string | null>(null);
   const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<PartnerSale | null>(null);
  const [saleDetail, setSaleDetail] = useState<PartnerSaleDetail | null>(null);
 
   const query = useMemo(() => {
     const q: Record<string, string> = {};
     if (status) q.status = status;
     if (limit) q.limit = String(limit);
     return q;
   }, [status, limit]);
 
   useEffect(() => {
     let active = true;
     async function load() {
       if (!token) return;
       setLoading(true);
       setError(null);
       try {
         const res = await getPartnerSales(token, query);
         if (active) {
           setItems(res.items || []);
           setNextCursor(res.nextCursor ?? null);
           setHasNextPage(Boolean(res.hasNextPage));
         }
       } catch (e) {
         if (active) setError("Falha ao carregar vendas");
       } finally {
         if (active) setLoading(false);
       }
     }
     load();
     return () => {
       active = false;
     };
   }, [token, query]);
 
   async function loadMore() {
     if (!token || !hasNextPage || !nextCursor) return;
     setLoading(true);
     setError(null);
     try {
       const res = await getPartnerSales(token, { ...query, cursor: nextCursor });
       setItems((prev) => [...prev, ...(res.items || [])]);
       setNextCursor(res.nextCursor ?? null);
       setHasNextPage(Boolean(res.hasNextPage));
     } catch {
       setError("Falha ao carregar mais vendas");
     } finally {
       setLoading(false);
     }
   }

  async function openDetail(sale: PartnerSale) {
    if (!token) return;
    setSelectedSale(sale);
    setDetailOpen(true);
    setSaleDetail(null);
    setDetailLoading(true);
    try {
      const res = await getPartnerSaleById(token, sale.id);
      setSaleDetail(res);
    } catch {
      setSaleDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setSelectedSale(null);
    setSaleDetail(null);
    setDetailLoading(false);
  }

   return (
     <div className="space-y-6">
       <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
         <h1 className="text-2xl font-bold text-dark dark:text-white">Vendas</h1>
         <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
           <div>
             <label className="mb-1 block text-sm">Status</label>
             <select
               value={status}
               onChange={(e) => setStatus(e.target.value)}
               className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
             >
               <option value="">Todos</option>
               <option value="paid">Pagas</option>
               <option value="pending">Pendentes</option>
               <option value="refunded">Reembolsadas</option>
               <option value="failed">Falhas</option>
             </select>
           </div>
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
           <div className="text-sm text-dark-5 dark:text-dark-6">{loading ? "Carregando..." : `${items.length} registros`}</div>
         </div>
         {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
         <div className="mt-4 overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
             <thead>
               <tr className="bg-gray-2 dark:bg-dark-3">
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Data</th>
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Cliente</th>
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Produto</th>
                 <th className="px-4 py-3 text-right text-sm font-semibold text-dark dark:text-white">Valor</th>
                 <th className="px-4 py-3 text-right text-sm font-semibold text-dark dark:text-white">Comissão</th>
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((s) => (
                <tr key={s.id} onClick={() => openDetail(s)} className="cursor-pointer hover:bg-gray-2/50 dark:hover:bg-dark-3/50">
                   <td className="px-4 py-3 text-sm">{new Date(s.created_at).toLocaleString("pt-BR")}</td>
                   <td className="px-4 py-3 text-sm">
                     <div className="font-medium">{s.customer_name || "-"}</div>
                     <div className="text-dark-5 dark:text-dark-6">{s.customer_email || "-"}</div>
                   </td>
                   <td className="px-4 py-3 text-sm">{s.product_name}</td>
                   <td className="px-4 py-3 text-right text-sm">R$ {(s.amount / 100).toFixed(2)}</td>
                   <td className="px-4 py-3 text-right text-sm">R$ {(s.commission_amount / 100).toFixed(2)}</td>
                   <td className="px-4 py-3 text-sm">
                     <span className="rounded-md bg-gray-2 px-2 py-1 text-xs dark:bg-dark-3">{s.status}</span>
                   </td>
                 </tr>
               ))}
               {!loading && items.length === 0 && (
                 <tr>
                   <td className="px-4 py-6 text-center text-sm text-dark-5 dark:text-dark-6" colSpan={6}>
                     Nenhuma venda encontrada.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
         <div className="mt-4 flex items-center justify-between">
           <div className="text-sm text-dark-5 dark:text-dark-6">
             {hasNextPage ? "Mais resultados disponíveis" : "Fim da lista"}
           </div>
           <button
             onClick={loadMore}
             disabled={!hasNextPage || loading}
             className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
           >
             {loading ? "Carregando..." : "Carregar mais"}
           </button>
         </div>
       </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark dark:text-white">Detalhes da venda</h3>
              <button onClick={closeDetail} className="rounded-md px-3 py-1 text-sm text-dark dark:text-white">
                Fechar
              </button>
            </div>
            {selectedSale && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-dark-5 dark:text-dark-6">Data</div>
                  <div className="text-sm">{new Date(selectedSale.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div>
                  <div className="text-sm text-dark-5 dark:text-dark-6">Status</div>
                  <div className="text-sm">{selectedSale.status}</div>
                </div>
                <div>
                  <div className="text-sm text-dark-5 dark:text-dark-6">Cliente</div>
                  <div className="text-sm">{selectedSale.customer_name} — {selectedSale.customer_email}</div>
                </div>
                <div>
                  <div className="text-sm text-dark-5 dark:text-dark-6">Produto</div>
                  <div className="text-sm">{selectedSale.product_name}</div>
                </div>
                <div>
                  <div className="text-sm text-dark-5 dark:text-dark-6">Valor</div>
                  <div className="text-sm">R$ {(selectedSale.amount / 100).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-dark-5 dark:text-dark-6">Comissão</div>
                  <div className="text-sm">R$ {(selectedSale.commission_amount / 100).toFixed(2)}</div>
                </div>
              </div>
            )}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-dark dark:text-white">Transação Pagar.me</h4>
              {detailLoading && <div className="mt-2 text-sm text-dark-5 dark:text-dark-6">Carregando...</div>}
              {!detailLoading && saleDetail?.transaction && (
                <div className="mt-2 rounded-lg border p-3 text-sm dark:border-dark-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-dark-5 dark:text-dark-6">ID</div>
                      <div>{(saleDetail.transaction as any)?.id || "-"}</div>
                    </div>
                    <div>
                      <div className="text-dark-5 dark:text-dark-6">Status</div>
                      <div>{(saleDetail.transaction as any)?.status || "-"}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-dark-5 dark:text-dark-6">Resumo</div>
                    <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-gray-2 p-2 text-xs dark:bg-dark-3">
                      {JSON.stringify(saleDetail.transaction, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {!detailLoading && !saleDetail?.transaction && (
                <div className="mt-2 text-sm text-dark-5 dark:text-dark-6">Sem dados da transação</div>
              )}
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
