import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart } from '../types';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextValue {
  cart: Cart;
  isLoading: boolean;
  itemCount: number;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const emptyCart: Cart = { items: [], subtotal: 0 };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart);
      return;
    }
    try {
      setIsLoading(true);
      const { data } = await cartApi.get();
      setCart(data);
    } catch {
      setCart(emptyCart);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      try {
        await cartApi.add(variantId, quantity);
        await refresh();
        toast.success('Item adicionado ao carrinho');
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Erro ao adicionar item');
        throw err;
      }
    },
    [refresh]
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        await cartApi.update(itemId, quantity);
        await refresh();
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Erro ao atualizar item');
        throw err;
      }
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        await cartApi.remove(itemId);
        setCart((prev) => ({
          ...prev,
          items: prev.items.filter((i) => i.id !== itemId),
          subtotal: prev.items
            .filter((i) => i.id !== itemId)
            .reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0),
        }));
        toast.success('Item removido');
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Erro ao remover item');
      }
    },
    []
  );

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, isLoading, itemCount, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
