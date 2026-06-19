import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export interface PreferenceItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePreferenceInput {
  orderId: string;
  items: PreferenceItem[];
  payer: { name: string; email: string };
  totalAmount: number;
}

export async function createPreference(input: CreatePreferenceInput) {
  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      external_reference: input.orderId,
      items: input.items.map((item, i) => ({
        id: String(i + 1),
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'BRL',
      })),
      payer: {
        name: input.payer.name,
        email: input.payer.email,
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/checkout/success`,
        failure: `${process.env.FRONTEND_URL}/checkout/failure`,
        pending: `${process.env.FRONTEND_URL}/checkout/pending`,
      },
      ...(process.env.NODE_ENV === 'production' ? { auto_return: 'approved' as const } : {}),
      ...(process.env.NODE_ENV === 'production' ? { notification_url: `${process.env.APP_URL}/api/checkout/webhook` } : {}),
      statement_descriptor: 'VN LIFE STYLE',
      payment_methods: {
        installments: 12,
        default_installments: 1,
      },
    },
  });

  return response;
}

export async function getPaymentInfo(paymentId: string) {
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

export async function refundPayment(mpPaymentId: string) {
  const refund = new PaymentRefund(client);
  return refund.create({ payment_id: Number(mpPaymentId), body: {} });
}
