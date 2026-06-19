import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function Cart() {
  const { cart, updateItem, removeItem, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const shippingCost = cart.subtotal >= 299 ? 0 : cart.subtotal > 0 ? 15 : 0;
  const total = cart.subtotal + shippingCost;

  if (isLoading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="w-8 h-8 border-2 border-text-muted border-t-text-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="container-app py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-text-muted mb-6" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">Seu carrinho está vazio</h1>
        <p className="text-text-muted mb-8">Adicione produtos para continuar comprando</p>
        <Link to="/produtos" className="btn-primary">
          Explorar Produtos
        </Link>
      </main>
    );
  }

  return (
    <main className="container-app py-8">
      <h1 className="section-title mb-8">Carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="card flex gap-4 p-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-surface-2 rounded-md overflow-hidden">
                {item.product.images[0] ? (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={24} className="text-text-muted" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-text-primary text-sm sm:text-base">{item.product.name}</h3>
                    <p className="text-text-muted text-xs mt-0.5">
                      {item.variant.size} · {item.variant.color}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-text-muted hover:text-danger transition-colors flex-shrink-0"
                    aria-label="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm text-text-primary">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.variant.stock}
                      className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="font-semibold text-text-primary">
                    R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-semibold text-text-primary mb-6 text-lg">Resumo do Pedido</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">R$ {cart.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Frete</span>
                <span className={shippingCost === 0 ? 'text-success' : 'text-text-primary'}>
                  {shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              {cart.subtotal < 299 && cart.subtotal > 0 && (
                <p className="text-xs text-text-muted">
                  Falta R$ {(299 - cart.subtotal).toFixed(2).replace('.', ',')} para frete grátis
                </p>
              )}
            </div>

            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                navigate('/checkout');
              }}
              size="lg"
              className="w-full gap-2"
            >
              Finalizar Compra
              <ArrowRight size={18} />
            </Button>

            <Link to="/produtos" className="block text-center text-text-muted text-sm mt-4 hover:text-text-secondary transition-colors">
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
