import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { adminApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Em separação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PROCESSING: '#8b5cf6',
  SHIPPED: '#06b6d4',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
};

interface RevenuePoint { date: string; revenue: number }
interface StatusCount { status: string; count: number }

interface DashboardData {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Array<Order & { user: { name: string; email: string } }>;
  revenueChart: RevenuePoint[];
  ordersByStatus: StatusCount[];
  lowStockCount: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getDashboard()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          label: 'Receita Total',
          value: `R$ ${data.totalRevenue.toFixed(2).replace('.', ',')}`,
          sub: `R$ ${data.todayRevenue.toFixed(2).replace('.', ',')} hoje`,
          icon: DollarSign,
          color: 'text-green-400',
        },
        { label: 'Pedidos', value: data.totalOrders, sub: `${data.todayOrders} hoje`, icon: ShoppingBag, color: 'text-text-primary' },
        { label: 'Clientes', value: data.totalUsers, sub: 'total', icon: Users, color: 'text-text-primary' },
        { label: 'Produtos Ativos', value: data.totalProducts, sub: data.lowStockCount > 0 ? `${data.lowStockCount} com estoque baixo` : 'em estoque', icon: Package, color: data.lowStockCount > 0 ? 'text-yellow-400' : 'text-text-primary' },
      ]
    : [];

  const pieData = data?.ordersByStatus.filter((s) => s.count > 0) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">Dashboard</h1>
        <span className="text-text-muted text-sm">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      </div>

      {data?.lowStockCount ? (
        <div className="flex items-center gap-2 p-3 mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
          <AlertTriangle size={16} />
          <span>{data.lowStockCount} variante{data.lowStockCount !== 1 ? 's' : ''} com estoque baixo (≤5 unidades)</span>
          <Link to="/admin/produtos" className="ml-auto underline hover:no-underline text-xs">Ver produtos</Link>
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-text-muted text-xs mt-1">{sub}</p>
                </div>
                <div className="w-10 h-10 bg-surface-2 rounded-lg flex items-center justify-center">
                  <Icon size={20} className="text-text-secondary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">Receita — últimos 7 dias</h2>
          {loading ? (
            <div className="skeleton h-48 rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.revenueChart.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis stroke="#666" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6 }}
                  labelStyle={{ color: '#999' }}
                  formatter={(v) => [`R$ ${Number(v).toFixed(2).replace('.', ',')}`, 'Receita']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#fff" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">Pedidos por status</h2>
          {loading ? (
            <div className="skeleton h-48 rounded" />
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#888'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6 }}
                  formatter={(v, name) => [v, STATUS_LABELS[name as OrderStatus] ?? name]}
                />
                <Legend formatter={(v) => STATUS_LABELS[v as OrderStatus] ?? v} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">Nenhum pedido ainda</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp size={18} />
            Pedidos Recentes
          </h2>
          <Link to="/admin/pedidos" className="text-sm text-text-muted hover:text-text-secondary">
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data?.recentOrders?.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-text-muted">{order.user.name}</p>
                </div>
                <span className="badge badge-neutral text-xs">
                  {STATUS_LABELS[order.status]}
                </span>
                <p className="font-medium text-text-primary text-sm flex-shrink-0">
                  R$ {Number(order.total).toFixed(2).replace('.', ',')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
