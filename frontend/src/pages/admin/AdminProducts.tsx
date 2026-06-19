import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2, X, AlertTriangle, Search } from 'lucide-react';
import { adminApi, productApi } from '../../services/api';
import { Product, Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { toast } from 'sonner';

interface VariantRow {
  id?: string;
  size: string;
  color: string;
  stock: string;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  sku: '',
  categoryId: '',
  featured: false,
};

const EMPTY_VARIANT: VariantRow = { size: '', color: '', stock: '0' };

const LIMIT = 15;

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState<VariantRow[]>([{ ...EMPTY_VARIANT }]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: LIMIT };
    if (search) params.search = search;
    if (categoryFilter) params.categoryId = categoryFilter;
    if (activeFilter !== '') params.active = activeFilter;
    adminApi
      .getProducts(params)
      .then(({ data }) => {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    adminApi.getCategories(true).then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    setter(e.target.value);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setVariants([{ ...EMPTY_VARIANT }]);
    setDeletedVariantIds([]);
    setImageUrl('');
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      comparePrice: product.comparePrice ? String(product.comparePrice) : '',
      sku: product.sku,
      categoryId: product.category?.id ?? '',
      featured: product.featured,
    });
    setVariants(
      product.variants?.length
        ? product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: String(v.stock) }))
        : [{ ...EMPTY_VARIANT }]
    );
    setDeletedVariantIds([]);
    setImageUrl(product.images?.[0]?.url ?? '');
    setShowModal(true);
  };

  const addVariant = () => setVariants((v) => [...v, { ...EMPTY_VARIANT }]);
  const removeVariant = (i: number) => {
    const v = variants[i];
    if (v.id) setDeletedVariantIds((prev) => [...prev, v.id!]);
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateVariant = (i: number, field: keyof VariantRow, value: string) =>
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  const handleSave = async () => {
    if (!form.name || !form.price || !form.sku || !form.categoryId) {
      toast.error('Preencha nome, preço, SKU e categoria');
      return;
    }
    const invalidVariant = variants.some((v) => !v.size || !v.color);
    if (invalidVariant) {
      toast.error('Preencha tamanho e cor de todas as variantes');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await productApi.update(editing.id, {
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          sku: form.sku,
          categoryId: form.categoryId,
          featured: form.featured,
          ...(form.comparePrice ? { comparePrice: parseFloat(form.comparePrice) } : {}),
          ...(imageUrl ? { images: [{ url: imageUrl, alt: form.name }] } : {}),
        });

        await Promise.all([
          ...deletedVariantIds.map((vid) => productApi.deleteVariant(editing.id, vid).catch(() => {})),
          ...variants.map((v) =>
            v.id
              ? productApi.updateVariant(editing.id, v.id, {
                  size: v.size,
                  color: v.color,
                  stock: parseInt(v.stock) || 0,
                })
              : productApi.addVariant(editing.id, {
                  size: v.size,
                  color: v.color,
                  stock: parseInt(v.stock) || 0,
                })
          ),
        ]);

        const { data: refreshed } = await productApi.get(editing.id);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? refreshed : p)));
        toast.success('Produto atualizado');
      } else {
        const { data } = await productApi.create({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          sku: form.sku,
          categoryId: form.categoryId,
          featured: form.featured,
          variants: variants.map((v) => ({
            size: v.size,
            color: v.color,
            stock: parseInt(v.stock) || 0,
          })),
          ...(form.comparePrice ? { comparePrice: parseFloat(form.comparePrice) } : {}),
          ...(imageUrl ? { images: [{ url: imageUrl, alt: form.name }] } : {}),
        });
        setProducts((prev) => [data, ...prev]);
        toast.success('Produto criado');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productApi.update(product.id, { active: !product.active });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
      );
      toast.success(`Produto ${!product.active ? 'ativado' : 'desativado'}`);
    } catch {
      toast.error('Erro ao atualizar produto');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Produtos</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className="input-field pl-8 text-sm py-2 w-full"
            />
          </div>
          <button type="submit" className="btn-secondary text-sm py-2 px-3">Buscar</button>
        </form>
        <select
          value={categoryFilter}
          onChange={handleFilterChange(setCategoryFilter)}
          className="input-field text-sm py-2 w-auto"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={handleFilterChange(setActiveFilter)}
          className="input-field text-sm py-2 w-auto"
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Produto</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Categoria</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Preço</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">SKU</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Status</th>
                <th className="text-left text-text-muted font-medium uppercase text-xs tracking-wider px-5 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-muted">Carregando...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-muted">Nenhum produto encontrado</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0].url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-surface-2 rounded" />
                        )}
                        <div>
                          <p className="font-medium text-text-primary line-clamp-1">{product.name}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-text-muted">{product.variants?.length ?? 0} variantes</p>
                            {product.variants?.some((v) => v.stock > 0 && v.stock <= 5) && (
                              <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                                <AlertTriangle size={10} />
                                estoque baixo
                              </span>
                            )}
                            {product.variants?.every((v) => v.stock === 0) && (
                              <span className="text-red-400 text-xs">esgotado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{product.category?.name}</td>
                    <td className="px-5 py-4 font-medium text-text-primary">
                      R$ {Number(product.price).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-5 py-4 text-text-muted font-mono text-xs">{product.sku}</td>
                    <td className="px-5 py-4">
                      <span className={product.active ? 'badge-success' : 'badge-danger'}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                          title={product.active ? 'Desativar' : 'Ativar'}
                        >
                          {product.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => openEdit(product)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
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

      <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-text-primary">
                {editing ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Nome do produto"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Camiseta Premium Preta"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-text-secondary mb-1.5">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Descrição do produto..."
                    className="input-field w-full resize-none"
                  />
                </div>

                <Input
                  label="Preço (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="149.90"
                />

                <Input
                  label="Preço original (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.comparePrice}
                  onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                  placeholder="199.90 (opcional)"
                />

                <Input
                  label="SKU"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                  placeholder="CAM-PREM-001"
                />

                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">Categoria</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="URL da imagem principal"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="accent-white"
                  />
                  <label htmlFor="featured" className="text-sm text-text-secondary">
                    Produto em destaque
                  </label>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Variantes</p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} />
                    Adicionar variante
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={v.id ?? `new-${i}`} className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        {i === 0 && (
                          <label className="block text-xs text-text-secondary mb-1.5">Tamanho</label>
                        )}
                        <div className="relative">
                          <Input
                            value={v.size}
                            onChange={(e) => updateVariant(i, 'size', e.target.value.toUpperCase())}
                            placeholder="P / M / G / GG"
                          />
                          {v.id && (
                            <span className="absolute -top-2 right-0 text-[10px] text-green-400 font-medium">
                              salvo
                            </span>
                          )}
                        </div>
                      </div>
                      <Input
                        label={i === 0 ? 'Cor' : undefined}
                        value={v.color}
                        onChange={(e) => updateVariant(i, 'color', e.target.value)}
                        placeholder="Preto"
                      />
                      <div className="flex gap-2 items-end">
                        <Input
                          label={i === 0 ? 'Estoque' : undefined}
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                          placeholder="0"
                        />
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(i)}
                            className="text-text-muted hover:text-red-400 transition-colors pb-2.5"
                            title={v.id ? 'Remover variante' : 'Cancelar'}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {editing ? 'Salvar alterações' : 'Criar produto'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
