import nodemailer from 'nodemailer';

const LOGO_URL = process.env.LOGO_URL || 'https://app.v1sofia.com/logo_sofia.png';
const YEAR = new Date().getFullYear();

const BaseTemplate = (content: string, footerText = `© ${YEAR} SOFIA — Inteligência que não brinca em serviço.`) => `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F6F8FA;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <tr>
          <td style="background:#081217;padding:32px;text-align:center;">
            <img src="${LOGO_URL}" width="130" alt="SOFIA" style="display:block;margin:0 auto;">
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;color:#333;">
            ${content}
          </td>
        </tr>

        <tr>
          <td style="background:#F3F4F6;text-align:center;padding:20px;color:#777;font-size:13px;">
            ${footerText}
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// Helper for green buttons
const GreenButton = (text: string, url: string) => `
<table style="margin:30px 0;">
  <tr>
    <td align="center" style="background:#34e03c;padding:14px 28px;border-radius:8px;">
      <a href="${url}" style="color:#081217;font-size:16px;font-weight:700;text-decoration:none;display:inline-block;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;

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

  const content = `
    <h2 style="margin:0;font-size:24px;font-weight:700;color:#081217;">
      Bem-vindo(a)${greetingName}!
    </h2>

    <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
      Seu pagamento foi confirmado e sua conta foi liberada com acesso premium.
    </p>

    <p style="font-size:15px;color:#555;">
      Para começar, crie sua senha clicando no botão abaixo:
    </p>

    ${GreenButton('Criar minha senha', options.setupLink)}

    <p style="font-size:13px;color:#777;margin-top:20px;">
      Esse link é pessoal e intransferível.
    </p>
  `;

  const html = BaseTemplate(content);

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
  paymentUrl?: string;
}) {
  const transport = createTransport();
  const greetingName = options.name ? `, ${options.name}` : '';
  let subject = 'Aviso sobre sua assinatura SOFIA';
  let message = '';
  let buttonText = 'Atualizar Pagamento';
  let buttonUrl = options.paymentUrl || 'https://app.v1sofia.com/settings/billing';

  if (options.cancelAt) {
    subject = 'Sua assinatura SOFIA foi cancelada';
    message = `
      <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
        Não conseguimos processar o pagamento da sua assinatura após algumas tentativas.
      </p>
      <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
        Para evitar cobranças indevidas, sua assinatura foi cancelada automaticamente e seu acesso premium foi suspenso.
      </p>
      <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
        Para reativar seu acesso, atualize seus dados de pagamento e assine novamente.
      </p>
    `;
    buttonText = 'Reativar Assinatura';
  } else if (options.retryCount === 1) {
    subject = 'Falha no pagamento da sua assinatura SOFIA';
    message = `
      <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
        Identificamos uma falha ao tentar renovar sua assinatura. Isso pode acontecer por limite insuficiente, cartão expirado ou bloqueio do banco.
      </p>
      <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
        Faremos uma nova tentativa automática em breve. Se você trocou de cartão, por favor atualize seus dados.
      </p>
    `;
  } else {
    subject = 'Ação necessária: Pagamento pendente';
    message = `
      <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
        Ainda não conseguimos processar o pagamento da sua assinatura.
      </p>
      <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
        Se o pagamento não for confirmado na próxima tentativa, sua assinatura poderá ser suspensa.
      </p>
    `;
  }

  const content = `
    <h2 style="margin:0;font-size:24px;font-weight:700;color:#081217;">
      Olá${greetingName}
    </h2>
    ${message}
    ${GreenButton(buttonText, buttonUrl)}
  `;

  const html = BaseTemplate(content);
  const text = `Olá${greetingName}\n\n` +
    `Houve um problema com sua assinatura SOFIA.\n` +
    `Acesse ${buttonUrl} para resolver.`;

  const from = process.env.SMTP_FROM || 'no-reply@localhost';
  await transport.sendMail({ from, to: options.to, subject, html, text });
}

export async function sendVerificationEmail(options: {
  to: string;
  name?: string | null;
  confirmationLink: string;
}) {
  const transport = createTransport();

  const subject = 'Confirme sua conta na SOFIA';
  const greetingName = options.name ? `, ${options.name}` : '';

  const content = `
    <h2 style="margin:0;font-size:24px;font-weight:700;color:#081217;">
      Bem-vindo(a)${greetingName}!
    </h2>

    <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
      Sua conta foi criada com sucesso. Para começar a usar a SOFIA, precisamos apenas que você confirme seu email.
    </p>

    <p style="font-size:15px;color:#555;">
      Clique no botão abaixo para confirmar:
    </p>

    ${GreenButton('Confirmar meu email', options.confirmationLink)}

    <p style="font-size:13px;color:#777;margin-top:20px;">
      Se você não criou esta conta, pode ignorar este email.
    </p>
  `;

  const html = BaseTemplate(content);

  const text = `Bem-vindo à SOFIA${greetingName}\n\n` +
    `Sua conta foi criada. Para confirmar seu email, acesse: ${options.confirmationLink}\n\n` +
    `Se você não criou esta conta, ignore este email.`;

  const from = process.env.SMTP_FROM || 'no-reply@localhost';
  await transport.sendMail({ from, to: options.to, subject, html, text });
}

export async function sendRecoveryEmail(options: {
  to: string;
  name?: string | null;
  recoveryLink: string;
}) {
  const transport = createTransport();

  const subject = 'Redefinição de senha - SOFIA';
  const greetingName = options.name ? `, ${options.name}` : '';

  const content = `
    <h2 style="margin:0;font-size:24px;font-weight:700;color:#081217;">
      Olá${greetingName}
    </h2>

    <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
      Recebemos uma solicitação para redefinir sua senha na SOFIA.
    </p>

    <p style="font-size:15px;color:#555;">
      Clique no botão abaixo para criar uma nova senha:
    </p>

    ${GreenButton('Redefinir Senha', options.recoveryLink)}

    <p style="font-size:13px;color:#777;margin-top:20px;">
      Se você não solicitou esta alteração, ignore este email. O link expirará em breve por segurança.
    </p>
  `;

  const html = BaseTemplate(content);
  const text = `Olá${greetingName}\n\n` +
    `Recebemos uma solicitação para redefinir sua senha.\n` +
    `Acesse o link para redefinir: ${options.recoveryLink}\n\n` +
    `Se não solicitou, ignore este email.`;

  const from = process.env.SMTP_FROM || 'no-reply@localhost';
  await transport.sendMail({ from, to: options.to, subject, html, text });
}

export async function sendFallbackAlertEmail(options: {
  reason: string;
  error?: string | null;
  backendUrl?: string | null;
  occurredAt?: string | null;
}) {
  const transport = createTransport();
  const to = process.env.FALLBACK_ALERT_EMAIL_TO || 'b.kaffer07@gmail.com';
  const from = process.env.SMTP_FROM || 'no-reply@localhost';
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
  const occurredAt = options.occurredAt || new Date().toISOString();
  const backendUrl = options.backendUrl || process.env.SOFIA_BACKEND_URL || 'unknown';

  const subject = 'SOFIA - Fallback ativado';

  const content = `
    <h2 style="margin:0;font-size:24px;font-weight:700;color:#081217;">
      Fallback ativado
    </h2>
    <p style="font-size:15px;line-height:22px;margin:16px 0;color:#555;">
      O sistema entrou em modo fallback ao tentar consumir o backend.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;font-size:14px;color:#111;">
      <tr><td style="padding:6px 0;color:#555;">Motivo</td><td style="padding:6px 0;font-weight:700;">${options.reason}</td></tr>
      <tr><td style="padding:6px 0;color:#555;">Ambiente</td><td style="padding:6px 0;font-weight:700;">${environment}</td></tr>
      <tr><td style="padding:6px 0;color:#555;">Backend</td><td style="padding:6px 0;font-weight:700;">${backendUrl}</td></tr>
      <tr><td style="padding:6px 0;color:#555;">Timestamp</td><td style="padding:6px 0;font-weight:700;">${occurredAt}</td></tr>
      ${options.error ? `<tr><td style="padding:6px 0;color:#555;">Erro</td><td style="padding:6px 0;font-weight:700;">${options.error}</td></tr>` : ''}
    </table>
  `;

  const html = BaseTemplate(content);
  const text =
    `SOFIA - Fallback ativado\n\n` +
    `Motivo: ${options.reason}\n` +
    `Ambiente: ${environment}\n` +
    `Backend: ${backendUrl}\n` +
    `Timestamp: ${occurredAt}\n` +
    (options.error ? `Erro: ${options.error}\n` : '');

  await transport.sendMail({ from, to, subject, html, text });
}
