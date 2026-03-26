import { create } from 'zustand';

export interface RequestItem {
  componentId: string;
  name: string;
  category: string;
  quantity: number;
  maxQuantity: number; // from components.max_issue_quantity
  maxDays: number; // from components.max_issue_days
}

interface RequestStore {
  items: RequestItem[];
  addItem: (item: RequestItem) => void;
  removeItem: (componentId: string) => void;
  updateQuantity: (componentId: string, quantity: number) => void;
  clearRequest: () => void;
  totalItems: () => number;
  getItem: (componentId: string) => RequestItem | undefined;
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  items: [],

  addItem: (item: RequestItem) => {
    set((state) => {
      const existing = state.items.find((i) => i.componentId === item.componentId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.componentId === item.componentId
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + item.quantity, i.maxQuantity),
                }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (componentId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.componentId !== componentId),
    }));
  },

  updateQuantity: (componentId: string, quantity: number) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.componentId === componentId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) }
          : i
      ),
    }));
  },

  clearRequest: () => {
    set({ items: [] });
  },

  totalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getItem: (componentId: string) => {
    return get().items.find((i) => i.componentId === componentId);
  },
}));
