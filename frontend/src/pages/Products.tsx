import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, ProductFilters } from '../types';
import { productApi } from '../services/api';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductFilter } from '../components/Product/ProductFilter';
import { SkeletonList } from '../components/ui/SkeletonCard';

const SORT_OPTIONS = [
  { value: '', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'newest', label: 'Mais recentes' },
];

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentPage = parseInt(searchParams.get('page') || '1');

  const getFiltersFromParams = useCallback((): ProductFilters => ({
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    size: searchParams.get('size') || undefined,
    color: searchParams.get('color') || undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
  }), [searchParams]);

  useEffect(() => {
    const params = {
      ...getFiltersFromParams(),
      page: currentPage,
      limit: 12,
    };

    setLoading(true);
    productApi
      .list(params as Record<string, unknown>)
      .then(({ data }) => {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchParams, currentPage, getFiltersFromParams]);

  const handleFilterChange = (filters: ProductFilters) => {
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') newParams.set(key, String(value));
    });
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(page));
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryLabel = searchParams.get('category');
  const searchLabel = searchParams.get('search');

  return (
    <main className="container-app py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="section-title">
            {searchLabel ? `Busca: "${searchLabel}"` : categoryLabel ? categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1) : 'Todos os Produtos'}
          </h1>
          {!loading && (
            <p className="text-text-muted text-sm mt-1">{total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ProductFilter filters={getFiltersFromParams()} onChange={handleFilterChange} />

          <select
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('sort', e.target.value);
              setSearchParams(newParams);
            }}
            className="input-field text-sm py-2 w-auto"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={12} />
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-4">Nenhum produto encontrado</p>
          <button onClick={() => handleFilterChange({})} className="btn-outline">
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-accent text-background'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-light'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
