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

  const steps = useMemo(
    () => [
      {
        id: "personal",
        title: "Dados pessoais",
        fields: ["name", "document", "motherName", "birthdate"],
      },
      {
        id: "contact",
        title: "Contato e renda",
        fields: ["monthlyIncome", "occupation", "phoneDdd", "phoneNumber"],
      },
      {
        id: "address",
        title: "Endereço",
        fields: ["zipCode", "stateUf", "street", "streetNumber", "neighborhood", "city"],
      },
      {
        id: "bank",
        title: "Dados bancários",
        fields: ["bank", "branch", "account", "digit", "accountType"],
      },
    ],
    [],
  );

  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slug, setSlug] = useState("");
  const [annualLink, setAnnualLink] = useState("");

  useEffect(() => {
    setName(partner?.name || "");
    setDocument(partner?.document || "");
  }, [partner]);

  function markTouched(keys: string[]) {
    setTouched((prev) => {
      const next = { ...prev };
      for (const k of keys) next[k] = true;
      return next;
    });
  }

  function getFieldError(key: string): string | null {
    switch (key) {
      case "name":
        if (!String(name || "").trim()) return "Informe seu nome completo.";
        return null;
      case "document": {
        if (!String(document || "").trim()) return "Informe seu CPF.";
        if (!isValidCPF(document)) return "CPF inválido.";
        return null;
      }
      case "motherName":
        if (!String(motherName || "").trim()) return "Informe o nome da sua mãe.";
        return null;
      case "birthdate":
        if (!String(birthdate || "").trim()) return "Informe sua data de nascimento.";
        return null;
      case "monthlyIncome":
        if (!String(monthlyIncome || "").trim()) return "Informe sua renda mensal.";
        if (parseMoneyToCents(monthlyIncome) <= 0) return "Informe uma renda mensal válida.";
        return null;
      case "occupation":
        if (!String(occupation || "").trim()) return "Informe sua profissão.";
        return null;
      case "phoneDdd":
        if (!String(phoneDdd || "").trim()) return "Informe o DDD.";
        if (sanitizeDigits(phoneDdd).length !== 2) return "DDD inválido.";
        return null;
      case "phoneNumber":
        if (!String(phoneNumber || "").trim()) return "Informe seu telefone.";
        if (sanitizeDigits(phoneNumber).length < 8) return "Telefone inválido.";
        return null;
      case "zipCode":
        if (!String(zipCode || "").trim()) return "Informe seu CEP.";
        if (sanitizeDigits(zipCode).length !== 8) return "CEP inválido.";
        return null;
      case "stateUf": {
        const uf = String(stateUf || "").trim();
        if (!uf) return "Informe a UF.";
        if (uf.length !== 2) return "UF inválida.";
        return null;
      }
      case "street":
        if (!String(street || "").trim()) return "Informe a rua.";
        return null;
      case "streetNumber":
        if (!String(streetNumber || "").trim()) return "Informe o número.";
        return null;
      case "neighborhood":
        if (!String(neighborhood || "").trim()) return "Informe o bairro.";
        return null;
      case "city":
        if (!String(city || "").trim()) return "Informe a cidade.";
        return null;
      case "bank":
        if (!String(bank || "").trim()) return "Informe o banco.";
        if (sanitizeDigits(bank).length < 3) return "Banco inválido.";
        return null;
      case "branch":
        if (!String(branch || "").trim()) return "Informe a agência.";
        return null;
      case "account":
        if (!String(account || "").trim()) return "Informe a conta.";
        return null;
      case "digit":
        if (!String(digit || "").trim()) return "Informe o dígito.";
        return null;
      case "accountType":
        if (!String(accountType || "").trim()) return "Selecione o tipo de conta.";
        return null;
      default:
        return null;
    }
  }

  const stepCount = steps.length;
  const currentStep = steps[Math.min(Math.max(step, 0), stepCount - 1)];

  const isStepValid = useMemo(() => {
    return !currentStep.fields.some((f) => Boolean(getFieldError(f)));
  }, [
    account,
    accountType,
    bank,
    birthdate,
    branch,
    city,
    currentStep.fields,
    digit,
    document,
    motherName,
    monthlyIncome,
    name,
    neighborhood,
    occupation,
    phoneDdd,
    phoneNumber,
    stateUf,
    steps,
    street,
    streetNumber,
    zipCode,
  ]);

  const isFormValid = useMemo(() => {
    const allFields = steps.flatMap((s) => s.fields);
    return !allFields.some((f) => Boolean(getFieldError(f)));
  }, [
    account,
    accountType,
    bank,
    birthdate,
    branch,
    city,
    digit,
    document,
    motherName,
    monthlyIncome,
    name,
    neighborhood,
    occupation,
    phoneDdd,
    phoneNumber,
    stateUf,
    steps,
    street,
    streetNumber,
    zipCode,
  ]);

  function handleBack() {
    setValidationError(null);
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function handleNext() {
    setValidationError(null);
    setError(null);
    markTouched(currentStep.fields);
    if (!isStepValid) {
      setValidationError("Revise os campos destacados para continuar.");
      return;
    }
    setStep((s) => Math.min(stepCount - 1, s + 1));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setValidationError(null);
    setSuccess(false);
    if (!token) return;

    const allFields = steps.flatMap((s) => s.fields);
    markTouched(allFields);
    if (!isFormValid) {
      setValidationError("Revise os campos destacados. Corrija CPF/telefone/CEP se necessário.");
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
        <h1 className="text-2xl font-bold text-dark dark:text-white">Cadastro de Parceiro</h1>
        <p className="mt-2 text-dark-5 dark:text-dark-6">Complete seu cadastro para liberar links com split automático.</p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-1 dark:border-dark-4 dark:bg-gray-dark">
        {!success ? (
          <form
            onSubmit={submit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && step < stepCount - 1) {
                e.preventDefault();
                handleNext();
              }
            }}
            className="space-y-6"
          >
            <div className="rounded-lg border bg-gray-2 p-4 text-sm dark:border-dark-3 dark:bg-dark-2">
              <div className="font-semibold text-dark dark:text-white">Sobre seus dados</div>
              <div className="mt-1 text-dark-5 dark:text-dark-6">
                As informações deste formulário são usadas no processo de validação KYC da Pagar.me (gateway de pagamento usado pela SOFIA) para comprovar seus dados e liberar o seu recipient_id, que conecta suas vendas aos valores disponíveis para saque. O sistema SOFIA não tem acesso as eles.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-dark-5 dark:text-dark-6">
                <div>
                  Etapa {step + 1} de {stepCount} — {currentStep.title}
                </div>
                <div>{Math.round(((step + 1) / stepCount) * 100)}%</div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-dark-3">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${((step + 1) / stepCount) * 100}%` }} />
              </div>
            </div>

            {(validationError || error) && (
              <div className="rounded-lg border bg-gray-2 p-3 text-sm text-red-600 dark:border-dark-3 dark:bg-dark-2">
                {validationError || error}
              </div>
            )}

            {step === 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Nome completo</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => markTouched(["name"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.name && getFieldError("name") && <div className="mt-1 text-xs text-red-light">{getFieldError("name")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">CPF</label>
                  <input
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    onBlur={() => markTouched(["document"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                    placeholder="000.000.000-00"
                  />
                  {touched.document && getFieldError("document") && <div className="mt-1 text-xs text-red-light">{getFieldError("document")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Nome da mãe</label>
                  <input
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    onBlur={() => markTouched(["motherName"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.motherName && getFieldError("motherName") && <div className="mt-1 text-xs text-red-light">{getFieldError("motherName")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Data de nascimento</label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    onBlur={() => markTouched(["birthdate"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.birthdate && getFieldError("birthdate") && <div className="mt-1 text-xs text-red-light">{getFieldError("birthdate")}</div>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm">Renda mensal (R$)</label>
                  <input
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    onBlur={() => markTouched(["monthlyIncome"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                    placeholder="5000"
                  />
                  {touched.monthlyIncome && getFieldError("monthlyIncome") && <div className="mt-1 text-xs text-red-light">{getFieldError("monthlyIncome")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Profissão</label>
                  <input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    onBlur={() => markTouched(["occupation"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.occupation && getFieldError("occupation") && <div className="mt-1 text-xs text-red-light">{getFieldError("occupation")}</div>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Site/URL (opcional)</label>
                  <input
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">DDD</label>
                  <input
                    value={phoneDdd}
                    onChange={(e) => setPhoneDdd(e.target.value)}
                    onBlur={() => markTouched(["phoneDdd"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                    placeholder="11"
                  />
                  {touched.phoneDdd && getFieldError("phoneDdd") && <div className="mt-1 text-xs text-red-light">{getFieldError("phoneDdd")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Telefone</label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onBlur={() => markTouched(["phoneNumber"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                    placeholder="999999999"
                  />
                  {touched.phoneNumber && getFieldError("phoneNumber") && <div className="mt-1 text-xs text-red-light">{getFieldError("phoneNumber")}</div>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm">CEP</label>
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onBlur={() => markTouched(["zipCode"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                    placeholder="00000-000"
                  />
                  {touched.zipCode && getFieldError("zipCode") && <div className="mt-1 text-xs text-red-light">{getFieldError("zipCode")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">UF</label>
                  <input
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value)}
                    onBlur={() => markTouched(["stateUf"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none uppercase dark:border-dark-3 dark:bg-dark-2"
                    placeholder="SP"
                    maxLength={2}
                  />
                  {touched.stateUf && getFieldError("stateUf") && <div className="mt-1 text-xs text-red-light">{getFieldError("stateUf")}</div>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Rua</label>
                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    onBlur={() => markTouched(["street"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.street && getFieldError("street") && <div className="mt-1 text-xs text-red-light">{getFieldError("street")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Número</label>
                  <input
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    onBlur={() => markTouched(["streetNumber"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.streetNumber && getFieldError("streetNumber") && <div className="mt-1 text-xs text-red-light">{getFieldError("streetNumber")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Complemento (opcional)</label>
                  <input
                    value={complementary}
                    onChange={(e) => setComplementary(e.target.value)}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Bairro</label>
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    onBlur={() => markTouched(["neighborhood"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.neighborhood && getFieldError("neighborhood") && <div className="mt-1 text-xs text-red-light">{getFieldError("neighborhood")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Cidade</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={() => markTouched(["city"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.city && getFieldError("city") && <div className="mt-1 text-xs text-red-light">{getFieldError("city")}</div>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Ponto de referência (opcional)</label>
                  <input
                    value={referencePoint}
                    onChange={(e) => setReferencePoint(e.target.value)}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm">Banco</label>
                  <input
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    onBlur={() => markTouched(["bank"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                    placeholder="001"
                  />
                  {touched.bank && getFieldError("bank") && <div className="mt-1 text-xs text-red-light">{getFieldError("bank")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Agência</label>
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    onBlur={() => markTouched(["branch"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.branch && getFieldError("branch") && <div className="mt-1 text-xs text-red-light">{getFieldError("branch")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Conta</label>
                  <input
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    onBlur={() => markTouched(["account"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.account && getFieldError("account") && <div className="mt-1 text-xs text-red-light">{getFieldError("account")}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm">Dígito</label>
                  <input
                    value={digit}
                    onChange={(e) => setDigit(e.target.value)}
                    onBlur={() => markTouched(["digit"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  />
                  {touched.digit && getFieldError("digit") && <div className="mt-1 text-xs text-red-light">{getFieldError("digit")}</div>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Tipo de conta</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    onBlur={() => markTouched(["accountType"])}
                    className="w-full rounded-lg border bg-gray-2 p-3 outline-none dark:border-dark-3 dark:bg-dark-2"
                  >
                    <option value="">Selecione</option>
                    <option value="checking">Conta corrente</option>
                    <option value="savings">Poupança</option>
                  </select>
                  {touched.accountType && getFieldError("accountType") && <div className="mt-1 text-xs text-red-light">{getFieldError("accountType")}</div>}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading || step === 0}
                className="rounded-lg border px-4 py-3 font-semibold text-dark disabled:opacity-60 dark:border-dark-3 dark:text-white"
              >
                Voltar
              </button>
              {step < stepCount - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || !token}
                  className="rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60"
                >
                  Continuar
                </button>
              ) : (
                <button type="submit" disabled={loading || !token} className="rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">
                  {loading ? "Enviando..." : "Concluir cadastro"}
                </button>
              )}
            </div>
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
