'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CartComponent {
  id: string;
  name: string;
  category: string;
  modelNumber?: string;
  quantityRequested: number;
  quantityAvailable: number;
}

interface RequestContextType {
  cartItems: CartComponent[];
  addToCart: (component: CartComponent) => void;
  removeFromCart: (componentId: string) => void;
  updateQuantity: (componentId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export function RequestProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartComponent[]>([]);

  const addToCart = useCallback((component: CartComponent) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === component.id);
      if (existing) {
        return prev.map((item) =>
          item.id === component.id
            ? {
                ...item,
                quantityRequested: Math.min(
                  item.quantityRequested + 1,
                  item.quantityAvailable
                ),
              }
            : item
        );
      }
      return [...prev, { ...component, quantityRequested: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((componentId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== componentId));
  }, []);

  const updateQuantity = useCallback(
    (componentId: string, quantity: number) => {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === componentId
            ? {
                ...item,
                quantityRequested: Math.max(
                  1,
                  Math.min(quantity, item.quantityAvailable)
                ),
              }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = cartItems.length;

  return (
    <RequestContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequest() {
  const context = useContext(RequestContext);
  if (context === undefined) {
    throw new Error('useRequest must be used within RequestProvider');
  }
  return context;
}
