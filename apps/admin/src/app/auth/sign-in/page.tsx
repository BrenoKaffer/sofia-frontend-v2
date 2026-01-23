 "use client";
 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/auth-context";
 import { useRouter } from "next/navigation";
 
 export default function SignInPage() {
   const { login, loading, logout } = useAuth();
   const router = useRouter();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [remember, setRemember] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     logout();
   }, [logout]);
 
   async function handleLogin() {
     setError(null);
     try {
       await login(email, password, remember);
       router.replace("/sales");
     } catch (err) {
       const msg = err instanceof Error ? err.message : "";
       if (msg === "forbidden_role") {
         setError("Sua conta não tem acesso de parceiro. Solicite role=partner.");
       } else {
         setError("Falha no login. Verifique suas credenciais.");
       }
     }
   }
 
   return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-dark flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm dark:border-dark-4 dark:bg-gray-dark">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-xl font-bold text-indigo-600">Sofia Admin</div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-dark dark:text-white">Entrar</h1>
        <p className="mb-6 text-sm text-dark-6 dark:text-dark-7">Acesse sua conta de parceiro.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
              className="w-full rounded-xl border bg-gray-2 p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-dark-3 dark:bg-dark-2"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                className="w-full rounded-xl border bg-gray-2 p-3 pr-10 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-dark-3 dark:bg-dark-2"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-dark-5 hover:text-dark focus:outline-none dark:text-dark-6 dark:hover:text-dark-7"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M2.707 2.293a1 1 0 0 1 1.414 0l17.586 17.586a1 1 0 0 1-1.414 1.414l-3.257-3.257A11.43 11.43 0 0 1 12 20C6.364 20 2.103 16.236 1.083 12.59a1.998 1.998 0 0 1 0-1.18 13.283 13.283 0 0 1 4.935-6.413L2.707 3.707a1 1 0 0 1 0-1.414zM12 8a4 4 0 0 1 4 4c0 .61-.137 1.189-.382 1.704l-5.322-5.322A3.97 3.97 0 0 1 12 8z" />
                    <path d="M12 4c5.636 0 9.897 3.764 10.917 7.41.167.592.167 1.212 0 1.804-.415 1.478-1.318 2.924-2.574 4.129l-2.103-2.103A6 6 0 0 0 8.76 6.76l-1.69-1.69A11.43 11.43 0 0 1 12 4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Manter conectado</span>
            </label>
            <a href="#" className="text-sm text-indigo-600">Precisa de ajuda?</a>
          </div>
          {error && <div className="text-sm text-red-light">{error}</div>}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
   );
 }
