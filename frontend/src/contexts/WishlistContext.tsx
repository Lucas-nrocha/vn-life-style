import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wishlistApi } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: Set<string>;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: new Set(),
  toggle: async () => {},
  isWishlisted: () => false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    wishlistApi
      .get()
      .then(({ data }) => {
        setWishlistIds(new Set(data.items.map((i: { product: { id: string } }) => i.product.id)));
      })
      .catch(() => {});
  }, [user]);

  const toggle = useCallback(async (productId: string) => {
    try {
      const { data } = await wishlistApi.toggle(productId);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (data.wishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } catch {}
  }, []);

  const isWishlisted = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
