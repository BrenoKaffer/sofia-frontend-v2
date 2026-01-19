'use client';
import { useEffect, useState } from 'react';
import { getPartnerBalance } from '@/lib/api/partner';
import { useAuth } from '@/contexts/auth-context';

export default function PartnerKpis() {
  const { token } = useAuth();
  const [data, setData] = useState<{ available: number; pending: number; total_sales: number; total_commission: number } | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await getPartnerBalance(token);
        if (active) setData(res);
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="text-sm">Saldo disponível</div>
        <div className="text-2xl font-bold">{loading ? '...' : `R$ ${(((data?.available ?? 0) / 100)).toFixed(2)}`}</div>
      </div>
      <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="text-sm">Saldo pendente</div>
        <div className="text-2xl font-bold">{loading ? '...' : `R$ ${(((data?.pending ?? 0) / 100)).toFixed(2)}`}</div>
      </div>
      <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="text-sm">Vendas</div>
        <div className="text-2xl font-bold">{loading ? '...' : `${data?.total_sales ?? 0}`}</div>
      </div>
      <div className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="text-sm">Comissões</div>
        <div className="text-2xl font-bold">{loading ? '...' : `R$ ${(((data?.total_commission ?? 0) / 100)).toFixed(2)}`}</div>
      </div>
    </div>
  );
}
