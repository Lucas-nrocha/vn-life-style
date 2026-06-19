import { useEffect, useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  imageUrl?: string | null;
}

const EMPTY_FORM = { name: '', imageUrl: '' };

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    adminApi
      .getCategories(true)
      .then(({ data }) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, imageUrl: cat.imageUrl ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}) };
      if (editing) {
        const { data } = await adminApi.updateCategory(editing.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === editing.id ? data : c)));
        toast.success('Categoria atualizada');
      } else {
        const { data } = await adminApi.createCategory(payload);
        setCategories((prev) => [...prev, data]);
        toast.success('Categoria criada');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat: Category) => {
    try {
      const { data } = await adminApi.updateCategory(cat.id, { active: !cat.active });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? data : c)));
      toast.success(`Categoria ${!cat.active ? 'ativada' : 'desativada'}`);
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Categorias</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Nome</th>
              <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Slug</th>
              <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Status</th>
              <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-text-muted">Carregando...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-text-muted">Nenhuma categoria</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-surface-2 transition-colors">
                <td className="px-5 py-4 font-medium text-text-primary">{cat.name}</td>
                <td className="px-5 py-4 text-text-muted font-mono text-xs">{cat.slug}</td>
                <td className="px-5 py-4">
                  <span className={cat.active ? 'badge-success' : 'badge-danger'}>
                    {cat.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(cat)} className="text-text-muted hover:text-text-primary transition-colors" title={cat.active ? 'Desativar' : 'Ativar'}>
                      {cat.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => openEdit(cat)} className="text-text-muted hover:text-text-primary transition-colors" title="Editar">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-text-primary">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Camisetas" />
              <Input label="URL da imagem (opcional)" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">{editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
