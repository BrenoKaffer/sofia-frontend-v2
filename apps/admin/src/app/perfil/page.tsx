"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { updatePartnerMe, getPartnerMe } from "@/lib/api/partner";

export default function PerfilPage() {
  const { token, partner } = useAuth();
  const [name, setName] = useState(partner?.name || "");
  const [document, setDocument] = useState(partner?.document || "");
  const [pixKey, setPixKey] = useState(partner?.pix_key || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [current, setCurrent] = useState(partner || null);

  useEffect(() => {
    setName(partner?.name || "");
    setDocument(partner?.document || "");
    setPixKey(partner?.pix_key || "");
    setCurrent(partner || null);
  }, [partner]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!token) return;
    setLoading(true);
    try {
      await updatePartnerMe(token, { name, document, pix_key: pixKey });
      const refreshed = await getPartnerMe(token).catch(() => null);
      setCurrent(refreshed || { id: "", user_id: "", name, document, ref_code: current?.ref_code || "", commission_percentage: current?.commission_percentage || 0, payout_balance: current?.payout_balance || 0, pix_key: pixKey });
      setMessage("Perfil atualizado");
    } catch {
      setMessage("Falha ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Meu perfil</h1>
        <p className="mt-2 text-dark-5 dark:text-dark-6">Código de referência: {current?.ref_code || "—"}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Documento</label>
            <input
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
            />
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
        <button type="submit" disabled={loading} className="mt-4 rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
