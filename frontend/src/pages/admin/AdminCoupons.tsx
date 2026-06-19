import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Coupon, Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

const EMPTY_FORM = {
  code: '',
  type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  value: '',
  minOrder: '',
  maxUses: '',
  expiresAt: '',
  categoryId: '',
  active: true,
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchCoupons = () => {
    setLoading(true);
    adminApi
      .getCoupons()
      .then(({ data }) => setCoupons(data))
      .catch(() => toast.error('Erro ao carregar cupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
    adminApi.getCategories().then(({ data }) => setCategories(data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrder: coupon.minOrder != null ? String(coupon.minOrder) : '',
      maxUses: coupon.maxUses != null ? String(coupon.maxUses) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      categoryId: coupon.categoryId ?? '',
      active: coupon.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value) {
      toast.error('Código e valor são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minOrder: form.minOrder ? parseFloat(form.minOrder) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        categoryId: form.categoryId || null,
        active: form.active,
      };

      if (editing) {
        const { data } = await adminApi.updateCoupon(editing.id, payload);
        setCoupons((prev) => prev.map((c) => (c.id === editing.id ? data : c)));
        toast.success('Cupom atualizado');
      } else {
        const { data } = await adminApi.createCoupon(payload);
        setCoupons((prev) => [data, ...prev]);
        toast.success('Cupom criado');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar cupom');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const { data } = await adminApi.updateCoupon(coupon.id, { active: !coupon.active });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data : c)));
      toast.success(`Cupom ${!coupon.active ? 'ativado' : 'desativado'}`);
    } catch {
      toast.error('Erro ao atualizar cupom');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Deletar cupom "${coupon.code}"?`)) return;
    try {
      await adminApi.deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success('Cupom removido');
    } catch {
      toast.error('Erro ao remover cupom');
    }
  };

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Cupons de Desconto</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} />
          Novo Cupom
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Código</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Tipo / Valor</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Regras</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Usos</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Validade</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Status</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-text-muted">Carregando...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-text-muted">Nenhum cupom cadastrado</td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-text-primary">{coupon.code}</td>
                    <td className="px-5 py-4 text-text-secondary">
                      {coupon.type === 'PERCENTAGE'
                        ? `${coupon.value}% off`
                        : `R$ ${Number(coupon.value).toFixed(2).replace('.', ',')} off`}
                    </td>
                    <td className="px-5 py-4 text-text-muted text-xs space-y-0.5">
                      {coupon.minOrder != null && (
                        <p>Mín. R$ {Number(coupon.minOrder).toFixed(2).replace('.', ',')}</p>
                      )}
                      {coupon.category && (
                        <p className="text-accent">Categoria: {coupon.category.name}</p>
                      )}
                      {!coupon.minOrder && !coupon.category && <p>—</p>}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {coupon.usedCount}
                      {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ''}
                    </td>
                    <td className="px-5 py-4 text-text-muted text-xs">
                      {coupon.expiresAt ? (
                        <span className={isExpired(coupon) ? 'text-red-400' : ''}>
                          {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                          {isExpired(coupon) && ' (expirado)'}
                        </span>
                      ) : (
                        'Sem validade'
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={coupon.active && !isExpired(coupon) ? 'badge-success' : 'badge-danger'}>
                        {coupon.active && !isExpired(coupon) ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(coupon)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                          title={coupon.active ? 'Desativar' : 'Ativar'}
                        >
                          {coupon.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => openEdit(coupon)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="text-text-muted hover:text-red-400 transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-text-primary">
                {editing ? 'Editar Cupom' : 'Novo Cupom'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Código"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="VNBEMVINDO"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'PERCENTAGE' | 'FIXED' }))}
                    className="input-field w-full"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED">Valor fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <Input
                    label={form.type === 'PERCENTAGE' ? 'Desconto (%)' : 'Desconto (R$)'}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === 'PERCENTAGE' ? '10' : '50.00'}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs text-text-muted mb-3 uppercase tracking-wider font-medium">Regras de aplicação</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Pedido mínimo (R$)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minOrder}
                      onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                      placeholder="100.00"
                    />
                    <p className="text-xs text-text-muted mt-1">Valor mínimo do carrinho</p>
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1.5">Categoria específica</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      className="input-field w-full"
                    >
                      <option value="">Todas as categorias</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted mt-1">Aplicar só a essa categoria</p>
                  </div>

                  <div>
                    <Input
                      label="Máximo de usos"
                      type="number"
                      min="1"
                      step="1"
                      value={form.maxUses}
                      onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                      placeholder="100"
                    />
                    <p className="text-xs text-text-muted mt-1">Deixe vazio para ilimitado</p>
                  </div>

                  <div>
                    <Input
                      label="Data de expiração"
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    />
                    <p className="text-xs text-text-muted mt-1">Deixe vazio para sem validade</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="accent-white"
                />
                <label htmlFor="active" className="text-sm text-text-secondary">Cupom ativo</label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {editing ? 'Salvar alterações' : 'Criar cupom'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
