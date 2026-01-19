"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password, remember);
      router.replace("/");
    } catch {
      setError("Falha no login. Verifique suas credenciais.");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
      <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="remember" className="text-sm">Manter conectado</label>
        </div>
        {error && <div className="text-sm text-red-light">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

