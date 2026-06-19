import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight, Tag, Heart, X } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { productApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Button } from '../components/ui/Button';
import { SkeletonDetail } from '../components/ui/SkeletonCard';
import { ReviewSection } from '../components/Product/ReviewSection';
import { ProductCard } from '../components/Product/ProductCard';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    productApi
      .get(id)
      .then(({ data }) => {
        setProduct(data);
        if (data.variants.length > 0) {
          setSelectedColor(data.variants[0].color);
        }
        if (data.category?.slug) {
          productApi
            .list({ category: data.category.slug, limit: 4 })
            .then(({ data: rel }) =>
              setRelatedProducts(rel.products.filter((p: Product) => p.id !== data.id).slice(0, 4))
            )
            .catch(() => {});
        }
      })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const availableSizes = product
    ? [...new Set(product.variants.filter((v) => v.color === selectedColor).map((v) => v.size))]
    : [];

  const colors = product ? [...new Set(product.variants.map((v) => v.color))] : [];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedVariant) return;

    setAddingToCart(true);
    try {
      await addItem(selectedVariant.id, quantity);
    } finally {
      setAddingToCart(false);
    }
  };

  const price = Number(product?.price ?? 0);
  const comparePrice = product?.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice
    ? Math.round((1 - price / comparePrice) * 100)
    : null;

  if (loading) {
    return (
      <div className="container-app py-8">
        <SkeletonDetail />
      </div>
    );
  }

  if (!product) return null;

  return (
    <main className="container-app py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div
            className="relative overflow-hidden rounded-lg bg-surface aspect-square mb-4 cursor-zoom-in"
            onClick={() => product.images.length > 0 && setZoomOpen(true)}
          >
            {product.images.length > 0 ? (
              <img
                src={product.images[activeImage]?.url}
                alt={product.images[activeImage]?.alt || product.name}
                className="w-full h-full object-cover" loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <ShoppingBag size={64} />
              </div>
            )}

            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((prev) => Math.max(0, prev - 1))}
                  disabled={activeImage === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/70 rounded-full flex items-center justify-center text-text-primary disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => Math.min(product.images.length - 1, prev + 1))}
                  disabled={activeImage === product.images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/70 rounded-full flex items-center justify-center text-text-primary disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                    i === activeImage ? 'border-accent' : 'border-border'
                  }`}
                >
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="animate-slide-up">
          <p className="text-text-muted text-sm mb-2">{product.category.name}</p>
          <h1 className="text-3xl font-bold text-text-primary mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold">
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
            {comparePrice && (
              <span className="text-text-muted line-through text-lg">
                R$ {comparePrice.toFixed(2).replace('.', ',')}
              </span>
            )}
            {discount && (
              <span className="badge bg-danger text-white font-bold">-{discount}%</span>
            )}
          </div>

          {price >= 299 && (
            <p className="text-success text-sm mb-4 flex items-center gap-1">
              ✓ Frete grátis para este produto
            </p>
          )}

          {colors.length > 1 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-text-primary mb-3">
                Cor: <span className="text-text-secondary">{selectedColor}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedVariant(null);
                    }}
                    className={`px-4 py-2 text-sm rounded border transition-colors ${
                      selectedColor === color
                        ? 'border-accent bg-accent text-background font-medium'
                        : 'border-border text-text-secondary hover:border-border-light'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-text-primary mb-3">
              Tamanho: <span className="text-text-secondary">{selectedVariant?.size || 'Selecione'}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {availableSizes.map((size) => {
                const variant = product.variants.find(
                  (v) => v.size === size && v.color === selectedColor
                );
                const outOfStock = (variant?.stock ?? 0) === 0;

                return (
                  <button
                    key={size}
                    disabled={outOfStock}
                    onClick={() => {
                      if (variant) setSelectedVariant(variant);
                      setQuantity(1);
                    }}
                    className={`w-12 h-12 text-sm rounded border font-medium transition-colors relative ${
                      selectedVariant?.size === size && selectedVariant.color === selectedColor
                        ? 'border-accent bg-accent text-background'
                        : outOfStock
                        ? 'border-border text-text-muted opacity-40 cursor-not-allowed line-through'
                        : 'border-border text-text-secondary hover:border-border-light'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedVariant && (
            <div className="mb-6">
              <p className="text-sm font-medium text-text-primary mb-3">Quantidade</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-md">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-text-primary font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => Math.min(selectedVariant.stock, prev + 1))}
                    className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-text-muted text-sm">{selectedVariant.stock} disponíveis</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <Button
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              loading={addingToCart}
              size="lg"
              className="flex-1 gap-3"
            >
              <ShoppingBag size={20} />
              {!selectedVariant ? 'Selecione um tamanho' : 'Adicionar ao Carrinho'}
            </Button>
            <button
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                toggle(product.id);
              }}
              className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all ${
                isWishlisted(product.id)
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-border text-text-muted hover:border-border-light hover:text-text-primary'
              }`}
              aria-label="Favoritar"
            >
              <Heart size={20} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-text-muted text-sm border border-border rounded-md p-3">
            <Tag size={14} />
            <span>Use o cupom <strong className="text-text-secondary">VNBEMVINDO</strong> para 10% de desconto</span>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="font-medium text-text-primary mb-3">Descrição</h3>
            <p className="text-text-secondary text-sm leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setZoomOpen(false)}
          >
            <X size={28} />
          </button>
          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImage((p) => Math.max(0, p - 1)); }}
                disabled={activeImage === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImage((p) => Math.min(product.images.length - 1, p + 1)); }}
                disabled={activeImage === product.images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <img
            src={product.images[activeImage]?.url}
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ReviewSection productId={product.id} />

      {relatedProducts.length > 0 && (
        <section className="mt-12 pt-10 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Você também pode gostar</h2>
            <Link
              to={`/produtos?category=${product.category.slug}`}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
