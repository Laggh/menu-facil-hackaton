import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Produto, PedidoProduto, Pedido } from '@shared/types';
import api from '@/lib/api';

interface CartContextValue {
  cart: PedidoProduto[];
  suggestions: Produto[];
  loadingSuggestions: boolean;
  userRecommendations: Produto[];
  loadingUserRecommendations: boolean;
  addToCart: (produto: Produto, observacao?: string) => void;
  removeFromCart: (produtoId: number) => void;
  updateQty: (produtoId: number, qty: number) => void;
  updateObservacao: (produtoId: number, observacao: string) => void;
  clearCart: () => void;
  placeOrder: () => Promise<Pedido>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<PedidoProduto[]>([]);
  const [suggestions, setSuggestions] = useState<Produto[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userRecommendations, setUserRecommendations] = useState<Produto[]>([]);
  const [loadingUserRecommendations, setLoadingUserRecommendations] = useState(false);

  // Função para buscar sugestões de forma assíncrona
  const fetchSuggestions = async (currentCart: PedidoProduto[]) => {
    if (currentCart.length === 0) {
      setSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const result = await api.products.getSuggestions(currentCart);
      setSuggestions(result.sugestoes || []);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Função para buscar recomendações do usuário
  const fetchUserRecommendations = async () => {
    try {
      setLoadingUserRecommendations(true);
      const result = await api.ai.getRecommendations();
      setUserRecommendations(result.recommendations || []);
    } catch (error) {
      console.error('Erro ao buscar recomendações do usuário:', error);
      setUserRecommendations([]);
    } finally {
      setLoadingUserRecommendations(false);
    }
  };

  // Buscar recomendações do usuário na inicialização
  useEffect(() => {
    fetchUserRecommendations();
  }, []);

  // useEffect para buscar sugestões sempre que o carrinho mudar
  useEffect(() => {
    fetchSuggestions(cart);
  }, [cart]);

  const addToCart = (produto: Produto, observacao?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.produto.id === produto.id);
      let newCart;
      
      if (existing) {
        newCart = prev.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        newCart = [
          ...prev,
          {
            produto,
            preco: produto.preco,
            quantidade: 1,
            observacao: observacao || undefined,
          },
        ];
      }

      return newCart;
    });
  };

  const removeFromCart = (produtoId: number) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.produto.id !== produtoId);
      return newCart;
    });
  };

  const updateQty = (produtoId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(produtoId);
      return;
    }
    setCart(prev => {
      const newCart = prev.map(item =>
        item.produto.id === produtoId ? { ...item, quantidade: qty } : item
      );
      
      return newCart;
    });
  };

  const updateObservacao = (produtoId: number, observacao: string) => {
    setCart(prev =>
      prev.map(item =>
        item.produto.id === produtoId ? { ...item, observacao: observacao || undefined } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setSuggestions([]);
  };

  const placeOrder = async () => {
    if (cart.length === 0) throw new Error('Carrinho vazio');
    const result = await api.orders.create(cart);
    clearCart();
    // Recarregar recomendações do usuário após realizar o pedido
    await fetchUserRecommendations();
    return result.order;
  };

  return (
    <CartContext.Provider value={{ cart, suggestions, loadingSuggestions, userRecommendations, loadingUserRecommendations, addToCart, removeFromCart, updateQty, updateObservacao, clearCart, placeOrder }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
