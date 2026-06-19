import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { user } = useAuth();
  const { toggle, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice
    ? Math.round((1 - price / comparePrice) * 100)
    : null;

  const coverImage = product.images?.[0]?.url;

  return (
    <div className="card group relative">
      <Link to={`/produtos/${product.id}`}>
        <div className="relative overflow-hidden aspect-[3/4] bg-surface-2">
          {coverImage ? (
            <img
              src={coverImage}
              alt={product.images[0].alt || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <ShoppingBag size={48} />
            </div>
          )}

          {discount && (
            <span className="absolute top-3 left-3 badge bg-danger text-white text-xs font-bold">
              -{discount}%
            </span>
          )}

          {product.featured && !discount && (
            <span className="absolute top-3 left-3 badge bg-surface text-text-secondary border border-border">
              Destaque
            </span>
          )}

          {product.variants.every((v) => v.stock === 0) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-surface text-text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-border">
                ESGOTADO
              </span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              if (!user) { navigate('/login'); return; }
              toggle(product.id);
            }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              isWishlisted(product.id)
                ? 'bg-red-500 text-white'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
            aria-label="Favoritar"
          >
            <Heart size={14} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/produtos/${product.id}`}>
          <p className="text-xs text-text-muted mb-1">{product.category.name}</p>
          <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-semibold text-text-primary">
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
            {comparePrice && (
              <span className="text-xs text-text-muted line-through ml-2">
                R$ {comparePrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {onAddToCart && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="p-2 rounded-full bg-surface-2 hover:bg-accent hover:text-background text-text-secondary transition-all duration-200"
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-1 mt-2 flex-wrap">
          {[...new Set(product.variants.map((v) => v.size))].slice(0, 4).map((size) => (
            <span key={size} className="text-xs text-text-muted border border-border px-1.5 py-0.5 rounded">
              {size}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
