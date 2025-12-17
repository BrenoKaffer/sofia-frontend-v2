import nodemailer from 'nodemailer';

const LOGO_URL = process.env.LOGO_URL || 'https://placehold.co/240x80/081217/FFF?text=SOFIA';
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
