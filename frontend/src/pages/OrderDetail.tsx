import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, CheckCircle, Clock, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderApi } from '../services/api';
import { toast } from 'sonner';

const STATUS_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Em separação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDING: <Clock size={18} />,
  CONFIRMED: <CheckCircle size={18} />,
  PROCESSING: <Package size={18} />,
  SHIPPED: <Truck size={18} />,
  DELIVERED: <CheckCircle size={18} />,
  CANCELLED: <XCircle size={18} />,
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  APPROVED: 'Pago',
  REJECTED: 'Pagamento recusado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

function getStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.indexOf(status);
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    orderApi
      .get(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="container-app py-8">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  if (notFound || !order) {
    return (
      <main className="container-app py-20 text-center">
        <Package size={64} className="mx-auto text-text-muted mb-6" />
        <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
        <Link to="/pedidos" className="btn-primary mt-4">Ver meus pedidos</Link>
      </main>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStep = getStepIndex(order.status);
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    setCancelling(true);
    try {
      await orderApi.cancel(order.id);
      setOrder((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
      toast.success('Pedido cancelado com sucesso');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar pedido');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <main className="container-app py-8">
      <Link to="/pedidos" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm mb-6">
        <ArrowLeft size={16} />
        Meus Pedidos
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Feito em {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full border ${isCancelled ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
            {STATUS_LABELS[order.status]}
          </span>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <AlertTriangle size={12} />
              {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </button>
          )}
        </div>
      </div>

      {!isCancelled && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-5">
            Acompanhar pedido
          </h2>
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-white transition-all duration-500"
              style={{
                width: currentStep > 0
                  ? `calc(${(currentStep / (STATUS_STEPS.length - 1)) * 100}% - 8px)`
                  : '0%',
              }}
            />
            <div className="relative flex justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        done
                          ? active
                            ? 'bg-white text-black ring-2 ring-white ring-offset-2 ring-offset-surface'
                            : 'bg-white text-black'
                          : 'bg-surface-2 text-text-muted border border-border'
                      }`}
                    >
                      {STATUS_ICONS[step]}
                    </div>
                    <span className={`text-[11px] font-medium text-center leading-tight max-w-[60px] ${done ? 'text-text-primary' : 'text-text-muted'}`}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {order.trackingCode && (
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Código de rastreio</p>
                  <p className="font-mono font-semibold text-text-primary">{order.trackingCode}</p>
                </div>
                <a
                  href={`https://rastreamento.correios.com.br/app/index.php?objetos=${order.trackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm flex items-center gap-2 py-2"
                >
                  <ExternalLink size={14} />
                  Rastrear nos Correios
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package size={14} />
              Itens do pedido
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-surface-2 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">{item.product.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.variant.size} · {item.variant.color}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-text-primary text-sm">
                      R$ {Number(item.totalPrice).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-text-muted">
                      R$ {Number(item.unitPrice).toFixed(2).replace('.', ',')} cada
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} />
              Endereço de entrega
            </h2>
            <div className="text-sm text-text-secondary space-y-0.5">
              <p className="font-medium text-text-primary">{order.address.label}</p>
              <p>{order.address.street}, {order.address.number}{order.address.complement ? `, ${order.address.complement}` : ''}</p>
              <p>{order.address.neighborhood}</p>
              <p>{order.address.city} – {order.address.state}</p>
              <p>CEP {order.address.zipCode}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={14} />
              Resumo do pagamento
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>R$ {Number(order.subtotal).toFixed(2).replace('.', ',')}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Desconto{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>– R$ {Number(order.discount).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Frete</span>
                <span>
                  {Number(order.shippingCost) === 0
                    ? <span className="text-green-400">Grátis</span>
                    : `R$ ${Number(order.shippingCost).toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-text-primary">
                <span>Total</span>
                <span>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {order.payment && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Status do pagamento</p>
                <p className={`text-sm font-medium ${order.payment.status === 'APPROVED' ? 'text-green-400' : order.payment.status === 'REJECTED' ? 'text-red-400' : 'text-text-secondary'}`}>
                  {PAYMENT_LABELS[order.payment.status] ?? order.payment.status}
                </p>
                {order.payment.paidAt && (
                  <p className="text-xs text-text-muted mt-0.5">
                    Pago em {new Date(order.payment.paidAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
