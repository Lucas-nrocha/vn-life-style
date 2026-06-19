import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, LogOut, Package, LayoutDashboard, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { SearchAutocomplete } from '../ui/SearchAutocomplete';
import { toast } from 'sonner';

export function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Até logo!');
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-bold text-xl tracking-widest text-text-primary">
            VN LIFE STYLE
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/produtos" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
              Produtos
            </Link>
            <Link to="/produtos?category=camisetas" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
              Camisetas
            </Link>
            <Link to="/produtos?category=calcas" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
              Calças
            </Link>
            <Link to="/produtos?category=jaquetas" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
              Jaquetas
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            <div className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Menu do usuário"
                >
                  <User size={20} />
                </button>
              ) : (
                <Link to="/login" className="text-text-secondary hover:text-text-primary transition-colors">
                  <User size={20} />
                </Link>
              )}

              {userMenuOpen && isAuthenticated && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-1rem)] bg-surface border border-border rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                      <p className="text-xs text-text-muted truncate">{user?.email}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                      >
                        <LayoutDashboard size={16} />
                        Admin
                      </Link>
                    )}
                    <Link
                      to="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                    >
                      <User size={16} />
                      Meu Perfil
                    </Link>
                    <Link
                      to="/pedidos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                    >
                      <Package size={16} />
                      Meus Pedidos
                    </Link>
                    <Link
                      to="/favoritos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                    >
                      <Heart size={16} />
                      Favoritos
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-surface-2 transition-colors border-t border-border"
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>

            <Link to="/carrinho" className="relative text-text-secondary hover:text-text-primary transition-colors" aria-label="Carrinho">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-background text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            <button
              className="md:hidden text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="py-3 border-t border-border animate-fade-in">
            <SearchAutocomplete onClose={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface animate-fade-in">
          <nav className="container-app py-4 flex flex-col gap-4">
            <Link to="/produtos" onClick={() => setMenuOpen(false)} className="text-text-secondary hover:text-text-primary font-medium">
              Todos os Produtos
            </Link>
            <Link to="/produtos?category=camisetas" onClick={() => setMenuOpen(false)} className="text-text-secondary hover:text-text-primary">
              Camisetas
            </Link>
            <Link to="/produtos?category=calcas" onClick={() => setMenuOpen(false)} className="text-text-secondary hover:text-text-primary">
              Calças
            </Link>
            <Link to="/produtos?category=jaquetas" onClick={() => setMenuOpen(false)} className="text-text-secondary hover:text-text-primary">
              Jaquetas
            </Link>
            {!isAuthenticated && (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline text-center">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
