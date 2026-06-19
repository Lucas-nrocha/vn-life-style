import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { wishlistApi } from '../services/api';
import { Product } from '../types';
import { ProductCard } from '../components/Product/ProductCard';

interface WishlistItem {
  id: string;
  product: Product;
}

export function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistApi
      .get()
      .then(({ data }) => setItems(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container-app py-8">
        <h1 className="section-title mb-8">Meus Favoritos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="container-app py-20 text-center">
        <Heart size={64} className="mx-auto text-text-muted mb-6" />
        <h1 className="text-2xl font-bold mb-2">Nenhum favorito ainda</h1>
        <p className="text-text-muted mb-8">Clique no coração em qualquer produto para salvar nos seus favoritos</p>
        <Link to="/produtos" className="btn-primary">Ver Produtos</Link>
      </main>
    );
  }

  return (
    <main className="container-app py-8">
      <h1 className="section-title mb-2">Meus Favoritos</h1>
      <p className="text-text-muted text-sm mb-8">{items.length} produto{items.length !== 1 ? 's' : ''} salvo{items.length !== 1 ? 's' : ''}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </main>
  );
}
