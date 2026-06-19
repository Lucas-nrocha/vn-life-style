import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { checkoutApi } from '../services/api';

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'approved' | 'pending' | 'rejected'>('loading');

  const orderId = searchParams.get('external_reference');
  const paymentStatus = searchParams.get('collection_status');

  useEffect(() => {
    if (paymentStatus === 'approved') {
      setStatus('approved');
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
    } else if (paymentStatus === 'rejected') {
      setStatus('rejected');
    } else if (orderId) {
      checkoutApi
        .getOrderStatus(orderId)
        .then(({ data }) => {
          if (data.paymentStatus === 'APPROVED') setStatus('approved');
          else if (data.paymentStatus === 'REJECTED') setStatus('rejected');
          else setStatus('pending');
        })
        .catch(() => setStatus('pending'));
    } else {
      setStatus('pending');
    }
  }, [orderId, paymentStatus]);

  const configs = {
    loading: {
      icon: <div className="w-16 h-16 border-4 border-text-muted border-t-text-primary rounded-full animate-spin mx-auto" />,
      title: 'Verificando pagamento...',
      desc: '',
      color: '',
    },
    approved: {
      icon: <CheckCircle size={64} className="mx-auto text-success" />,
      title: 'Pagamento Aprovado!',
      desc: 'Seu pedido foi confirmado e estará em preparação em breve.',
      color: 'text-success',
    },
    pending: {
      icon: <Clock size={64} className="mx-auto text-warning" />,
      title: 'Pagamento em Análise',
      desc: 'Seu pagamento está sendo processado. Você receberá a confirmação por email.',
      color: 'text-warning',
    },
    rejected: {
      icon: <XCircle size={64} className="mx-auto text-danger" />,
      title: 'Pagamento Não Aprovado',
      desc: 'Houve um problema com o seu pagamento. Tente novamente ou use outro método.',
      color: 'text-danger',
    },
  };

  const config = configs[status];

  return (
    <main className="container-app py-20 text-center max-w-lg mx-auto">
      <div className="card p-10">
        <div className="mb-6">{config.icon}</div>
        <h1 className={`text-2xl font-bold mb-3 ${config.color}`}>{config.title}</h1>
        <p className="text-text-muted mb-8">{config.desc}</p>

        {orderId && status !== 'loading' && (
          <p className="text-text-secondary text-sm mb-6">
            Pedido #{orderId.slice(0, 8).toUpperCase()}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {status === 'rejected' ? (
            <Link to="/carrinho" className="btn-primary">
              Tentar Novamente
            </Link>
          ) : (
            <Link to="/pedidos" className="btn-primary flex items-center gap-2 justify-center">
              <Package size={16} />
              Ver Meus Pedidos
            </Link>
          )}
          <Link to="/produtos" className="btn-outline">
            Continuar Comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
