import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { productApi } from '../services/api';
import { ProductCard } from '../components/Product/ProductCard';
import { SkeletonList } from '../components/ui/SkeletonCard';

export function Category() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const categoryName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '';

  useEffect(() => {
    if (!slug) { navigate('/produtos'); return; }
    setLoading(true);
    productApi
      .list({ category: slug, page, limit: 12 })
      .then(({ data }) => {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => navigate('/produtos'))
      .finally(() => setLoading(false));
  }, [slug, page, navigate]);

  return (
    <main className="container-app py-8">
      <div className="mb-8">
        <p className="text-text-muted text-sm mb-1">
          <a href="/produtos" className="hover:text-text-primary transition-colors">Todos os Produtos</a>
          {' '}/ {categoryName}
        </p>
        <h1 className="section-title">{categoryName}</h1>
        {!loading && (
          <p className="text-text-muted text-sm mt-1">
            {total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonList count={12} />
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-4">Nenhum produto nesta categoria</p>
          <a href="/produtos" className="btn-outline">Ver todos os produtos</a>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-accent text-background'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-light'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
