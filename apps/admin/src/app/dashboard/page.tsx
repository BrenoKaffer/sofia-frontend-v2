 "use client";
 import Link from "next/link";
 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/auth-context";
 import { getPartnerBalance, getPartnerSales, getPartnerLinks } from "@/lib/api/partner";
import { ClockIcon, PercentIcon, ShoppingBagIcon, WalletIcon } from "@/components/Layouts/header/icons";
 import type { PartnerSale } from "@/types/partner";
 
 export default function DashboardPage() {
   const { token, partner } = useAuth();
   const [balance, setBalance] = useState<{ available: number; pending: number; total_sales: number; total_commission: number } | null>(null);
   const [sales, setSales] = useState<PartnerSale[]>([]);
   const [links, setLinks] = useState<{ url: string; label: string }[]>([]);
   const [loading, setLoading] = useState(false);
 
   useEffect(() => {
     let active = true;
     async function load() {
       if (!token) return;
       setLoading(true);
       try {
         const b = await getPartnerBalance(token);
         const s = await getPartnerSales(token, { limit: "10" });
         const l = await getPartnerLinks(token);
         if (active) {
           setBalance(b);
           setSales(s.items || []);
          setLinks((l.items || []).map((it) => ({ url: it.url, label: it.label ?? "Link Padrão" })));
         }
       } finally {
         if (active) setLoading(false);
       }
     }
     load();
     return () => {
       active = false;
     };
   }, [token]);
 
   return (
     <div className="space-y-6">
       <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
         <h1 className="text-2xl font-bold text-dark dark:text-white">Dashboard</h1>
         <div className="mt-2 text-sm text-dark-5 dark:text-dark-6">{partner?.name || ""}</div>
         <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <div className="rounded-lg border p-4 dark:border-dark-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-dark-5 dark:text-dark-6">Saldo disponível</div>
                <div className="mt-1 text-xl font-semibold">R$ {((balance?.available || 0) / 100).toFixed(2)}</div>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-green-light-7 text-green dark:bg-green/10">
                <WalletIcon className="h-5 w-5" />
              </div>
            </div>
           </div>
           <div className="rounded-lg border p-4 dark:border-dark-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-dark-5 dark:text-dark-6">Saques pendentes</div>
                <div className="mt-1 text-xl font-semibold">R$ {((balance?.pending || 0) / 100).toFixed(2)}</div>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-yellow-light-4 text-yellow-dark dark:bg-yellow-dark/10">
                <ClockIcon className="h-5 w-5" />
              </div>
            </div>
           </div>
           <div className="rounded-lg border p-4 dark:border-dark-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-dark-5 dark:text-dark-6">Total de vendas</div>
                <div className="mt-1 text-xl font-semibold">R$ {((balance?.total_sales || 0) / 100).toFixed(2)}</div>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-blue-light-5 text-blue dark:bg-blue/10">
                <ShoppingBagIcon className="h-5 w-5" />
              </div>
            </div>
           </div>
           <div className="rounded-lg border p-4 dark:border-dark-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-dark-5 dark:text-dark-6">Total em comissão</div>
                <div className="mt-1 text-xl font-semibold">R$ {((balance?.total_commission || 0) / 100).toFixed(2)}</div>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary dark:bg-primary/15">
                <PercentIcon className="h-5 w-5" />
              </div>
            </div>
           </div>
         </div>
       </div>
 
       <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
         <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold text-dark dark:text-white">Seus links</h2>
         </div>
         <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
           {links.map((link) => (
             <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="rounded-lg border p-3 text-sm hover:bg-gray-2 dark:border-dark-4 dark:hover:bg-dark-3">
               <div className="font-medium">{link.label}</div>
               <div className="text-dark-5 dark:text-dark-6">{link.url}</div>
             </a>
           ))}
           {links.length === 0 && (
             <div className="text-sm text-dark-5 dark:text-dark-6">
               <div>Nenhum link disponível.</div>
               <div className="mt-3">
                 <Link href="/afiliado/cadastro" className="inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-white">
                   Completar cadastro de afiliado
                 </Link>
               </div>
             </div>
           )}
         </div>
       </div>
 
       <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
         <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold text-dark dark:text-white">Últimas vendas</h2>
           <div className="text-sm text-dark-5 dark:text-dark-6">{loading ? "Carregando..." : `${sales.length} registros`}</div>
         </div>
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
               {sales.map((s) => (
                 <tr key={s.id}>
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
               {sales.length === 0 && (
                 <tr>
                   <td className="px-4 py-6 text-center text-sm text-dark-5 dark:text-dark-6" colSpan={6}>
                     Nenhuma venda recente.
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
