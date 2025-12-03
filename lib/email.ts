import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST || 'smtp.zeptomail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = false;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, tls: { rejectUnauthorized: true }, connectionTimeout: 10000 });
}

export async function sendPasswordSetupEmail(options: {
  to: string;
  name?: string | null;
  setupLink: string;
}) {
  const transport = createTransport();

  const subject = 'Crie sua senha para acessar a SOFIA';
  const greetingName = options.name ? `, ${options.name}` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color:#111;">Bem-vindo à SOFIA${greetingName}</h2>
      <p>Seu pagamento foi confirmado e sua conta foi liberada com acesso premium.</p>
      <p>Para começar, crie sua senha clicando no botão abaixo:</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${options.setupLink}" style="background:#4f46e5; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px; display:inline-block;">Criar minha senha</a>
      </p>
      <p>Este link expira por segurança. Caso expire, você poderá solicitar outro na tela "Esqueci minha senha".</p>
      <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size:12px; color:#555;">Se você não reconhece este acesso, por favor ignore este email.</p>
    </div>
  `;

  const text = `Bem-vindo à SOFIA${greetingName}\n\n` +
    `Seu pagamento foi confirmado e sua conta premium está liberada.\n` +
    `Para criar sua senha, acesse: ${options.setupLink}\n\n` +
    `Este link expira por segurança. Caso expire, use a opção "Esqueci minha senha" na tela de login.`;

  const from = process.env.SMTP_FROM || 'no-reply@localhost';
  await transport.sendMail({ from, to: options.to, subject, html, text });
}

export async function sendDunningEmail(options: {
  to: string;
  name?: string | null;
  retryCount: number;
  nextRetryAt?: string | null;
  cancelAt?: string | null;
  paymentUrl?: string | null;
}) {
  const transport = createTransport();
  const subject = options.retryCount >= 3 ? 'Assinatura cancelada por falta de pagamento' : `Tentativa de cobrança ${options.retryCount}/3`;
  const greetingName = options.name ? `, ${options.name}` : '';
  const nextText = options.retryCount >= 3 ? '' : (options.nextRetryAt ? `Próxima tentativa: ${new Date(options.nextRetryAt).toLocaleString('pt-BR')}.` : '');
  const cancelText = options.cancelAt ? `Cancelamento automático em: ${new Date(options.cancelAt).toLocaleString('pt-BR')}.` : '';
  const payLink = options.paymentUrl ? `<p style="text-align:center; margin: 24px 0;"><a href="${options.paymentUrl}" style="background:#dc2626; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px; display:inline-block;">Pagar agora</a></p>` : '';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color:#111;">Sua assinatura SOFIA${greetingName}</h2>
      <p>Detectamos falha na cobrança. Esta é a tentativa ${options.retryCount} de 3.</p>
      ${payLink}
      <p>${nextText} ${cancelText}</p>
      <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size:12px; color:#555;">Se o pagamento já foi realizado, desconsidere este aviso.</p>
    </div>
  `;
  const text = `Sua assinatura SOFIA${greetingName}\nFalha na cobrança. Tentativa ${options.retryCount} de 3.\n${options.paymentUrl ? `Pagar: ${options.paymentUrl}\n` : ''}${nextText} ${cancelText}`.trim();
  const from = process.env.SMTP_FROM || 'no-reply@localhost';
  await transport.sendMail({ from, to: options.to, subject, html, text });
}
