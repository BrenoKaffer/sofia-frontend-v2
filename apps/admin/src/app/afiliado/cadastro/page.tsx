"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { registerPartnerAffiliate } from "@/lib/api/partner";

const sanitizeDigits = (v: string) => v.replace(/\D/g, "");

function isValidCPF(raw: string): boolean {
  const cpf = sanitizeDigits(raw);
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number.parseInt(cpf.charAt(i), 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10 || d1 === 11) d1 = 0;
  if (d1 !== Number.parseInt(cpf.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number.parseInt(cpf.charAt(i), 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10 || d2 === 11) d2 = 0;
  return d2 === Number.parseInt(cpf.charAt(10), 10);
}

function parseMoneyToCents(v: string) {
  const n = Number(String(v || "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export default function CadastroAfiliadoPage() {
  const { token, partner } = useAuth();

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [motherName, setMotherName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [occupation, setOccupation] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [phoneDdd, setPhoneDdd] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complementary, setComplementary] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [bank, setBank] = useState("");
  const [branch, setBranch] = useState("");
  const [account, setAccount] = useState("");
  const [digit, setDigit] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings" | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slug, setSlug] = useState("");
  const [annualLink, setAnnualLink] = useState("");

  useEffect(() => {
    setName(partner?.name || "");
    setDocument(partner?.document || "");
  }, [partner]);

  const valid = useMemo(() => {
    const emailOk = true;
    const cpfOk = isValidCPF(document);
    const ufOk = String(stateUf || "").trim().length === 2;
    const phoneOk = sanitizeDigits(phoneDdd).length === 2 && sanitizeDigits(phoneNumber).length >= 8;
    const zipOk = sanitizeDigits(zipCode).length === 8;
    const incomeOk = parseMoneyToCents(monthlyIncome) > 0;

    const required =
      name &&
      document &&
      motherName &&
      birthdate &&
      monthlyIncome &&
      occupation &&
      phoneDdd &&
      phoneNumber &&
      zipCode &&
      street &&
      streetNumber &&
      neighborhood &&
      city &&
      stateUf &&
      bank &&
      branch &&
      account &&
      digit &&
      accountType;

    return Boolean(required && emailOk && cpfOk && ufOk && phoneOk && zipOk && incomeOk);
  }, [account, accountType, bank, birthdate, branch, city, digit, document, motherName, monthlyIncome, name, neighborhood, occupation, phoneDdd, phoneNumber, stateUf, street, streetNumber, zipCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!token) return;

    if (!valid) {
      setError("Preencha todos os campos obrigatórios e verifique CPF/telefone/CEP.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerPartnerAffiliate(token, {
        name,
        document: sanitizeDigits(document),
        bank_account: {
          holder_name: name,
          bank: sanitizeDigits(bank),
          branch_number: sanitizeDigits(branch),
          account_number: sanitizeDigits(account),
          account_check_digit: sanitizeDigits(digit),
          type: accountType as "checking" | "savings",
        },
        register_information: {
          mother_name: motherName,
          birthdate,
          monthly_income: parseMoneyToCents(monthlyIncome),
          professional_occupation: occupation,
          site_url: siteUrl || undefined,
          address: {
            street,
            street_number: streetNumber,
            complementary: complementary || undefined,
            neighborhood,
            city,
            state: String(stateUf || "").trim().toUpperCase(),
            zip_code: sanitizeDigits(zipCode),
            reference_point: referencePoint || undefined,
          },
          phone_numbers: [{ ddd: sanitizeDigits(phoneDdd), number: sanitizeDigits(phoneNumber) }],
        },
      });

      if (!res?.success) {
        const err = (res as any)?.error;
        const message = typeof err === "string" ? err : (err?.message || JSON.stringify(err) || "Falha ao registrar afiliado");
        setError(message);
        setSuccess(false);
        return;
      }

      setSuccess(true);
      setSlug(res?.affiliate_slug || "");
      setAnnualLink(res?.checkout_links?.annual || "");
    } catch (err: any) {
      setError(err?.message || "Erro inesperado");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Cadastro de Afiliado</h1>
        <p className="mt-2 text-dark-5 dark:text-dark-6">Complete seu cadastro para liberar links com split automático.</p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        {!success ? (
          <form onSubmit={submit} className="space-y-6">
            {error && <div className="rounded-lg border bg-gray-2 p-3 text-sm text-red-600 dark:border-dark-3 dark:bg-dark-2">{error}</div>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">CPF</label>
                <input value={document} onChange={(e) => setDocument(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Nome da mãe</label>
                <input value={motherName} onChange={(e) => setMotherName(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Data de nascimento</label>
                <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Renda mensal (R$)</label>
                <input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" placeholder="5000" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Profissão</label>
                <input value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Site/URL (opcional)</label>
                <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" placeholder="https://" />
              </div>
              <div>
                <label className="mb-1 block text-sm">DDD</label>
                <input value={phoneDdd} onChange={(e) => setPhoneDdd(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" placeholder="11" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Telefone</label>
                <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" placeholder="999999999" />
              </div>
            </div>

            <div className="h-px w-full bg-gray-200 dark:bg-dark-3" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">CEP</label>
                <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" placeholder="00000-000" />
              </div>
              <div>
                <label className="mb-1 block text-sm">UF</label>
                <input value={stateUf} onChange={(e) => setStateUf(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none uppercase dark:border-dark-3 dark:bg-dark-2" placeholder="SP" maxLength={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Rua</label>
                <input value={street} onChange={(e) => setStreet(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Número</label>
                <input value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Complemento (opcional)</label>
                <input value={complementary} onChange={(e) => setComplementary(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Bairro</label>
                <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Cidade</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Ponto de referência (opcional)</label>
                <input value={referencePoint} onChange={(e) => setReferencePoint(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
            </div>

            <div className="h-px w-full bg-gray-200 dark:bg-dark-3" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">Banco</label>
                <input value={bank} onChange={(e) => setBank(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" placeholder="001" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Agência</label>
                <input value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Conta</label>
                <input value={account} onChange={(e) => setAccount(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Dígito</label>
                <input value={digit} onChange={(e) => setDigit(e.target.value)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">Tipo de conta</label>
                <select value={accountType} onChange={(e) => setAccountType(e.target.value as any)} className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2">
                  <option value="">Selecione</option>
                  <option value="checking">Conta corrente</option>
                  <option value="savings">Poupança</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading || !token} className="rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">
              {loading ? "Enviando..." : "Concluir cadastro"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-2 p-4 text-sm dark:border-dark-3 dark:bg-dark-2">
              <div className="font-semibold">Cadastro concluído</div>
              <div className="mt-1 text-dark-5 dark:text-dark-6">Seu código de afiliado: {slug || "—"}</div>
            </div>
            {annualLink && (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-gray-2 p-3 dark:border-dark-3 dark:bg-dark-2">
                <div className="min-w-0">
                  <div className="truncate text-sm">{annualLink}</div>
                </div>
                <button onClick={() => copy(annualLink)} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
                  Copiar
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Link href="/links" className="rounded-lg bg-primary px-4 py-3 font-semibold text-white">
                Ir para Meus Links
              </Link>
              <Link href="/dashboard" className="rounded-lg border px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:text-white">
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

