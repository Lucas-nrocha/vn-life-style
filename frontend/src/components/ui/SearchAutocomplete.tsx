import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { productApi } from '../../services/api';
import { Product } from '../../types';

interface Props {
  onClose: () => void;
}

export function SearchAutocomplete({ onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    productApi
      .list({ search: q, limit: 5 })
      .then(({ data }) => setSuggestions(data.products))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/produtos?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSelect = (product: Product) => {
    navigate(`/produtos/${product.id}`);
    onClose();
  };

  const showDropdown = focused && (loading || suggestions.length > 0 || (query.length >= 2 && !loading));

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Buscar produtos..."
            className="input-field w-full pr-8"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-text-muted rounded-full animate-spin" />
          )}
        </div>
        <button type="submit" className="btn-primary px-4 py-2">
          <Search size={18} />
        </button>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={() => handleSelect(product)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-surface-2 rounded flex-shrink-0 flex items-center justify-center">
                      <ShoppingBag size={14} className="text-text-muted" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                    <p className="text-xs text-text-muted">
                      R$ {Number(product.price).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={handleSubmit as any}
                className="w-full px-4 py-3 text-sm text-text-muted hover:bg-surface-2 text-center border-t border-border transition-colors"
              >
                Ver todos os resultados para "<span className="text-text-secondary">{query}</span>"
              </button>
            </>
          ) : query.length >= 2 && !loading ? (
            <div className="px-4 py-4 text-sm text-text-muted text-center">
              Nenhum produto encontrado para "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
