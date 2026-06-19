import { useEffect, useState, useCallback } from 'react';
import { Download, CheckSquare, Square, Minus, RotateCcw } from 'lucide-react';
import { adminApi, orderApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { Pagination } from '../../components/ui/Pagination';
import { toast } from 'sonner';

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

const LIMIT = 20;

type OrderRow = Order & { user: { name: string; email: string } };

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setSelected(new Set());
    const params: Record<string, unknown> = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    adminApi
      .getOrders(params)
      .then(({ data }) => {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await orderApi.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkAction = async (status: OrderStatus) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => orderApi.updateStatus(id, status)));
      setOrders((prev) => prev.map((o) => (selected.has(o.id) ? { ...o, status } : o)));
      toast.success(`${selected.size} pedido(s) atualizados para "${STATUS_LABELS[status]}"`);
      setSelected(new Set());
    } catch {
      toast.error('Erro ao atualizar pedidos em massa');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRefund = async (orderId: string) => {
    setRefundingId(orderId);
    setConfirmRefundId(null);
    try {
      await adminApi.refundOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' as OrderStatus } : o)));
      toast.success('Reembolso processado e pedido cancelado');
    } catch {
      toast.error('Erro ao processar reembolso');
    } finally {
      setRefundingId(null);
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const someSelected = orders.some((o) => selected.has(o.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="section-title">Pedidos</h1>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value as OrderStatus | ''); }}
            className="input-field w-auto text-sm py-2"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={async () => {
              try {
                const { data } = await adminApi.exportOrdersCsv();
                const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'pedidos.csv';
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                toast.error('Erro ao exportar');
              }
            }}
            className="btn-secondary text-sm flex items-center gap-2 py-2 px-3"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-sm">
          <span className="text-text-secondary font-medium">{selected.size} selecionado(s)</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-text-muted text-xs">Marcar como:</span>
            {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleBulkAction(s)}
                disabled={bulkLoading}
                className="text-xs px-2.5 py-1 rounded border border-border text-text-secondary hover:bg-surface transition-colors disabled:opacity-50"
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-text-muted hover:text-text-primary transition-colors ml-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 w-10">
                  <button onClick={toggleAll} className="text-text-muted hover:text-text-primary transition-colors">
                    {allSelected ? (
                      <CheckSquare size={16} />
                    ) : someSelected ? (
                      <Minus size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-4 py-4">Pedido</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-4 py-4">Cliente</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-4 py-4">Total</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-4 py-4">Status</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-4 py-4">Alterar</th>
                <th className="px-4 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-text-muted">Carregando...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-text-muted">Nenhum pedido encontrado</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-surface-2 transition-colors ${selected.has(order.id) ? 'bg-surface-2' : ''}`}
                  >
                    <td className="px-4 py-4 w-10">
                      <button
                        onClick={() => toggleSelect(order.id)}
                        className="text-text-muted hover:text-text-primary transition-colors"
                      >
                        {selected.has(order.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-text-primary">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-text-primary">{order.user.name}</p>
                      <p className="text-xs text-text-muted">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-text-primary">
                      R$ {Number(order.total).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={STATUS_BADGE[order.status]}>{STATUS_LABELS[order.status]}</span>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="input-field text-xs py-1.5 w-auto"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      {['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                        confirmRefundId === order.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRefund(order.id)}
                              disabled={refundingId === order.id}
                              className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmRefundId(null)}
                              className="text-xs text-text-muted hover:text-text-primary transition-colors"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRefundId(order.id)}
                            disabled={refundingId === order.id}
                            title="Reembolsar"
                            className="text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
    </div>
  );
}
