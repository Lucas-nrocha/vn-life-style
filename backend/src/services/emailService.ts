import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'VN Life Style <onboarding@resend.dev>';

interface OrderEmailData {
  userName: string;
  userEmail: string;
  orderId: string;
  total: number;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #333;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">R$ ${item.unitPrice.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  await resend.emails.send({
    from: FROM,
    to: data.userEmail,
    subject: `Pedido #${data.orderId.slice(0, 8).toUpperCase()} confirmado — VN Life Style`,
    html: `
      <div style="font-family:Inter,sans-serif;background:#0a0a0a;color:#f5f5f5;max-width:600px;margin:0 auto;padding:40px 20px;">
        <h1 style="color:#f5f5f5;font-size:24px;margin-bottom:8px;">VN LIFE STYLE</h1>
        <p style="color:#888;margin-bottom:32px;">Obrigado pelo seu pedido, ${data.userName}!</p>

        <div style="background:#111;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:24px;">
          <h2 style="color:#f5f5f5;font-size:18px;margin-bottom:16px;">
            Pedido #${data.orderId.slice(0, 8).toUpperCase()}
          </h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="color:#888;font-size:12px;text-transform:uppercase;">
                <th style="padding:8px;text-align:left;">Produto</th>
                <th style="padding:8px;text-align:center;">Qtd</th>
                <th style="padding:8px;text-align:right;">Preço</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="border-top:1px solid #333;padding-top:16px;margin-top:16px;text-align:right;">
            <strong style="color:#f5f5f5;font-size:18px;">
              Total: R$ ${data.total.toFixed(2)}
            </strong>
          </div>
        </div>

        <p style="color:#888;font-size:14px;">
          Você pode acompanhar seu pedido na área de <strong>Meus Pedidos</strong>.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Redefinir senha — VN Life Style',
    html: `
      <div style="font-family:Inter,sans-serif;background:#0a0a0a;color:#f5f5f5;max-width:600px;margin:0 auto;padding:40px 20px;">
        <h1 style="color:#f5f5f5;font-size:24px;margin-bottom:8px;">VN LIFE STYLE</h1>
        <p style="color:#888;margin-bottom:24px;">Olá, ${name}!</p>
        <p style="color:#f5f5f5;margin-bottom:24px;">
          Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:
        </p>
        <a href="${resetLink}"
           style="display:inline-block;background:#f5f5f5;color:#0a0a0a;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-bottom:24px;">
          Redefinir Senha
        </a>
        <p style="color:#888;font-size:12px;">
          Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.
        </p>
      </div>
    `,
  });
}
