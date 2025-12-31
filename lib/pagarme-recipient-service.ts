export type RecipientBankAccount = {
  holder_name: string;
  bank: string;
  branch_number: string;
  account_number: string;
  account_check_digit: string;
  type: 'checking' | 'savings';
};

export type CreateRecipientPayload = {
  name: string;
  email: string;
  document: string;
  bank_account: RecipientBankAccount;
};

function getHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export async function createRecipientOnPagarme(payload: CreateRecipientPayload): Promise<any> {
  const apiKey = process.env.PAGARME_API_KEY;
  if (!apiKey) throw new Error('PAGARME_API_KEY não configurada');
  const body = {
    name: payload.name,
    email: payload.email,
    document: payload.document,
    type: 'individual',
    default_bank_account: {
      holder_name: String(payload.bank_account.holder_name || '').toUpperCase().trim(),
      holder_type: 'individual',
      bank: payload.bank_account.bank,
      branch_number: payload.bank_account.branch_number,
      account_number: payload.bank_account.account_number,
      account_check_digit: payload.bank_account.account_check_digit,
      type: payload.bank_account.type,
    },
    automatic_anticipation_settings: { enabled: true, type: 'full' },
    transfer_settings: { transfer_enabled: true, transfer_interval: 'daily', transfer_day: 1 },
  };
  const res = await fetch('https://api.pagar.me/core/v5/recipients', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
  }
  return res.json();
}

export async function getRecipientOnPagarme(recipientId: string): Promise<any> {
  const apiKey = process.env.PAGARME_API_KEY;
  if (!apiKey) throw new Error('PAGARME_API_KEY não configurada');
  const res = await fetch(`https://api.pagar.me/core/v5/recipients/${recipientId}`, {
    method: 'GET',
    headers: getHeaders(apiKey),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
  }
  return res.json();
}

export async function updateRecipientOnPagarme(recipientId: string, payload: CreateRecipientPayload): Promise<any> {
  const apiKey = process.env.PAGARME_API_KEY;
  if (!apiKey) throw new Error('PAGARME_API_KEY não configurada');
  const body = {
    name: payload.name,
    email: payload.email,
    document: payload.document,
    type: 'individual',
    default_bank_account: {
      holder_name: String(payload.bank_account.holder_name || '').toUpperCase().trim(),
      holder_type: 'individual',
      bank: payload.bank_account.bank,
      branch_number: payload.bank_account.branch_number,
      account_number: payload.bank_account.account_number,
      account_check_digit: payload.bank_account.account_check_digit,
      type: payload.bank_account.type,
    },
    automatic_anticipation_settings: { enabled: true, type: 'full' },
    transfer_settings: { transfer_enabled: true, transfer_interval: 'daily', transfer_day: 1 },
  };
  const res = await fetch(`https://api.pagar.me/core/v5/recipients/${recipientId}`, {
    method: 'PATCH',
    headers: getHeaders(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
  }
  return res.json();
}
