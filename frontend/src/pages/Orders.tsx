import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderApi } from '../services/api';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Em separação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-neutral',
  PROCESSING: 'badge-neutral',
  SHIPPED: 'badge-neutral',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .list()
      .then(({ data }) => setOrders(data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-app py-8">
        <h1 className="section-title mb-8">Meus Pedidos</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="container-app py-20 text-center">
        <Package size={64} className="mx-auto text-text-muted mb-6" />
        <h1 className="text-2xl font-bold mb-2">Nenhum pedido ainda</h1>
        <p className="text-text-muted mb-8">Seus pedidos aparecerão aqui após a compra</p>
        <Link to="/produtos" className="btn-primary">Comprar Agora</Link>
      </main>
    );
  }

  return (
    <main className="container-app py-8">
      <h1 className="section-title mb-8">Meus Pedidos</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/pedidos/${order.id}`}
            className="card p-5 flex items-center gap-4 hover:border-border-light transition-colors group"
          >
            <div className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center flex-shrink-0">
              <Package size={18} className="text-text-secondary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-medium text-text-primary text-sm">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <span className={STATUS_BADGE[order.status]}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-text-muted text-xs mt-0.5">
                {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} ·{' '}
                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-text-primary">
                R$ {Number(order.total).toFixed(2).replace('.', ',')}
              </p>
              <ChevronRight size={16} className="ml-auto mt-1 text-text-muted group-hover:text-text-secondary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
