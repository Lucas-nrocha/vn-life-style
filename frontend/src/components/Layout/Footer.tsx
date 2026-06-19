import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter } from 'lucide-react';
import { newsletterApi } from '../../services/api';
import { toast } from 'sonner';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await newsletterApi.subscribe(email);
      setSubscribed(true);
      toast.success('Inscrição realizada!');
    } catch {
      toast.error('Erro ao se inscrever. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="container-app py-12">
        <div className="mb-10 p-6 bg-surface-2 rounded-xl border border-border text-center">
          <h3 className="font-semibold text-text-primary mb-1">Fique por dentro das novidades</h3>
          <p className="text-text-muted text-sm mb-4">Receba promoções exclusivas e lançamentos em primeira mão</p>
          {subscribed ? (
            <p className="text-green-400 text-sm font-medium">✓ Você está inscrito na newsletter!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="input-field flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-sm px-5 py-2 disabled:opacity-60"
              >
                {loading ? '...' : 'Inscrever'}
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg tracking-widest mb-4">VN LIFE STYLE</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Moda masculina premium com estilo e qualidade para o homem moderno.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-text-primary mb-4 uppercase tracking-wider">
              Produtos
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link to="/produtos?category=camisetas" className="hover:text-text-primary transition-colors">Camisetas</Link></li>
              <li><Link to="/produtos?category=calcas" className="hover:text-text-primary transition-colors">Calças</Link></li>
              <li><Link to="/produtos?category=bermudas" className="hover:text-text-primary transition-colors">Bermudas</Link></li>
              <li><Link to="/produtos?category=jaquetas" className="hover:text-text-primary transition-colors">Jaquetas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-text-primary mb-4 uppercase tracking-wider">
              Conta
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link to="/login" className="hover:text-text-primary transition-colors">Entrar</Link></li>
              <li><Link to="/cadastro" className="hover:text-text-primary transition-colors">Cadastrar</Link></li>
              <li><Link to="/pedidos" className="hover:text-text-primary transition-colors">Meus Pedidos</Link></li>
              <li><Link to="/perfil" className="hover:text-text-primary transition-colors">Meu Perfil</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-text-primary mb-4 uppercase tracking-wider">
              Informações
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><a href="#" className="hover:text-text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Trocas e Devoluções</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Contato</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} VN Life Style. Todos os direitos reservados.
          </p>
          <p className="text-text-muted text-xs">
            Frete grátis acima de R$ 299,00
          </p>
        </div>
      </div>
    </footer>
  );
}
