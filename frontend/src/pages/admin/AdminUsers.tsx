import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { adminApi } from '../../services/api';
import { User } from '../../types';
import { Pagination } from '../../components/ui/Pagination';

const LIMIT = 20;

export function AdminUsers() {
  const [users, setUsers] = useState<(User & { _count: { orders: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: LIMIT };
    if (search) params.search = search;
    adminApi
      .getUsers(params)
      .then(({ data }) => {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Usuários</h1>
        <p className="text-sm text-text-muted">{total} usuário{total !== 1 ? 's' : ''}</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="input-field pl-8 text-sm py-2 w-full"
          />
        </div>
        <button type="submit" className="btn-secondary text-sm py-2 px-3">Buscar</button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Limpar
          </button>
        )}
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Nome</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Email</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Função</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Pedidos</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">Carregando...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                    {search ? 'Nenhum usuário encontrado para esta busca' : 'Nenhum usuário'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-4 font-medium text-text-primary">{user.name}</td>
                    <td className="px-5 py-4 text-text-secondary">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className={user.role === 'ADMIN' ? 'badge badge-warning' : 'badge-neutral'}>
                        {user.role === 'ADMIN' ? 'Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{user._count?.orders ?? 0}</td>
                    <td className="px-5 py-4 text-text-muted">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
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
