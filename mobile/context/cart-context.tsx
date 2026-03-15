import React, { createContext, useContext, useState } from 'react';
import type { Produto, PedidoProduto } from '@shared/types';
import api from '@/lib/api';

interface CartContextValue {
  cart: PedidoProduto[];
  addToCart: (produto: Produto, observacao?: string) => void;
  removeFromCart: (produtoId: number) => void;
  updateQty: (produtoId: number, qty: number) => void;
  updateObservacao: (produtoId: number, observacao: string) => void;
  clearCart: () => void;
  placeOrder: (usuarioId: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<PedidoProduto[]>([]);

  const addToCart = (produto: Produto, observacao?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.produto.id === produto.id);
      if (existing) {
        return prev.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          produto,
          preco: produto.preco,
          quantidade: 1,
            observacao: observacao || undefined,
        },
      ];
    });
  };

  const removeFromCart = (produtoId: number) => {
    setCart(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const updateQty = (produtoId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(produtoId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.produto.id === produtoId ? { ...item, quantidade: qty } : item
      )
    );
  };

  const updateObservacao = (produtoId: number, observacao: string) => {
    setCart(prev =>
      prev.map(item =>
        item.produto.id === produtoId ? { ...item, observacao: observacao || undefined } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (usuarioId: number) => {
    if (cart.length === 0) throw new Error('Carrinho vazio');
    await api.orders.create(usuarioId, cart);
    clearCart();
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, updateObservacao, clearCart, placeOrder }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
