import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Users, Ticket, ArrowLeft, Tag, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, end: false },
  { to: '/admin/produtos', label: 'Produtos', icon: Package, end: false },
  { to: '/admin/categorias', label: 'Categorias', icon: Tag, end: false },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users, end: false },
  { to: '/admin/cupons', label: 'Cupons', icon: Ticket, end: false },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex-shrink-0 md:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao Site
          </Link>
          <button
            className="md:hidden text-text-muted hover:text-text-primary transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="p-3 flex-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mb-1 transition-colors ${
                  isActive
                    ? 'bg-surface-2 text-text-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-muted">VN Life Style Admin</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Abrir menu admin"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium text-text-primary">Admin</span>
        </div>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
