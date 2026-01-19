 "use client";
 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/auth-context";
 import { getPartnerBalance, requestPayout, getPartnerPayouts } from "@/lib/api/partner";
 import type { PartnerPayout } from "@/types/partner";
 
 export default function FinancePage() {
   const { token } = useAuth();
   const [balance, setBalance] = useState<{ available: number; pending: number; total_sales: number; total_commission: number } | null>(null);
   const [loading, setLoading] = useState(false);
   const [amount, setAmount] = useState<string>("");
   const [method, setMethod] = useState<string>("pix");
   const [pixKey, setPixKey] = useState<string>("");
   const [message, setMessage] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
 
   useEffect(() => {
     let active = true;
     async function load() {
       if (!token) return;
       setLoading(true);
       try {
         const res = await getPartnerBalance(token);
         if (active) setBalance(res);
       } finally {
         if (active) setLoading(false);
       }
     }
     load();
     return () => {
       active = false;
     };
   }, [token]);
 
  useEffect(() => {
    let active = true;
    async function loadPayouts() {
      if (!token) return;
      setLoadingPayouts(true);
      try {
        const res = await getPartnerPayouts(token);
        if (active) setPayouts(res.items || []);
      } finally {
        if (active) setLoadingPayouts(false);
      }
    }
    loadPayouts();
    return () => {
      active = false;
    };
  }, [token]);

   async function onRequestPayout(e: React.FormEvent) {
     e.preventDefault();
     setMessage(null);
     if (!token) return;
     const value = Math.round(Number(amount) * 100);
     if (!(value > 0)) {
       setMessage("Valor inválido");
       return;
     }
     try {
       await requestPayout(token, value, method, pixKey || undefined);
       setMessage("Solicitação de saque enviada");
       setAmount("");
       setPixKey("");
     } catch {
       setMessage("Falha ao solicitar saque");
     }
   }
 
   return (
     <div className="space-y-6">
       <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
         <h1 className="text-2xl font-bold text-dark dark:text-white">Financeiro</h1>
         <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
           <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
             <div className="text-sm">Saldo disponível</div>
             <div className="text-2xl font-bold">{loading ? "..." : `R$ ${(((balance?.available ?? 0) / 100)).toFixed(2)}`}</div>
           </div>
           <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
             <div className="text-sm">Saldo pendente</div>
             <div className="text-2xl font-bold">{loading ? "..." : `R$ ${(((balance?.pending ?? 0) / 100)).toFixed(2)}`}</div>
           </div>
           <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
             <div className="text-sm">Vendas</div>
             <div className="text-2xl font-bold">{loading ? "..." : `${balance?.total_sales ?? 0}`}</div>
           </div>
           <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
             <div className="text-sm">Comissões</div>
             <div className="text-2xl font-bold">{loading ? "..." : `R$ ${(((balance?.total_commission ?? 0) / 100)).toFixed(2)}`}</div>
           </div>
         </div>
       </div>
 
       <form onSubmit={onRequestPayout} className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
         <h2 className="text-xl font-bold text-dark dark:text-white">Solicitar saque</h2>
         <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
           <div>
             <label className="mb-1 block text-sm">Valor (R$)</label>
             <input
               type="number"
               min="0"
               step="0.01"
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
             />
           </div>
           <div>
             <label className="mb-1 block text-sm">Método</label>
             <select
               value={method}
               onChange={(e) => setMethod(e.target.value)}
               className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
             >
               <option value="pix">PIX</option>
             </select>
           </div>
           <div>
             <label className="mb-1 block text-sm">Chave PIX</label>
             <input
               type="text"
               value={pixKey}
               onChange={(e) => setPixKey(e.target.value)}
               className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
             />
           </div>
         </div>
         {message && <div className="mt-3 text-sm">{message}</div>}
         <button type="submit" className="mt-4 rounded-lg bg-primary px-4 py-3 font-semibold text-white">Solicitar</button>
       </form>

       <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
         <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold text-dark dark:text-white">Histórico de saques</h2>
           <div className="text-sm text-dark-5 dark:text-dark-6">{loadingPayouts ? "Carregando..." : `${payouts.length} registros`}</div>
         </div>
         <div className="mt-4 overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
             <thead>
               <tr className="bg-gray-2 dark:bg-dark-3">
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Data</th>
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Método</th>
                 <th className="px-4 py-3 text-right text-sm font-semibold text-dark dark:text-white">Valor</th>
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Status</th>
                 <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">Transação</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
               {payouts.map((p) => (
                 <tr key={p.id}>
                   <td className="px-4 py-3 text-sm">
                     {p.requested_at ? new Date(p.requested_at).toLocaleString("pt-BR") : "-"}
                   </td>
                   <td className="px-4 py-3 text-sm">{p.method || "-"}</td>
                   <td className="px-4 py-3 text-right text-sm">R$ {(p.amount / 100).toFixed(2)}</td>
                   <td className="px-4 py-3 text-sm">
                     <span className="rounded-md bg-gray-2 px-2 py-1 text-xs dark:bg-dark-3">{p.status}</span>
                   </td>
                   <td className="px-4 py-3 text-sm">{p.transaction_id || "-"}</td>
                 </tr>
               ))}
               {!loadingPayouts && payouts.length === 0 && (
                 <tr>
                   <td className="px-4 py-6 text-center text-sm text-dark-5 dark:text-dark-6" colSpan={5}>
                     Nenhum saque registrado.
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
