import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  isLoading: false,

  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  setLoading: (isLoading) => set({ isLoading })
}));

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart')) || [],
  
  addItem: (product, quantity = 1, addOns = []) => {
    const { items } = get();
    const existingItem = items.find(item => item.id === product._id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.push({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        addOns,
        subtotal: product.price * quantity
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items });
  },

  removeItem: (productId) => {
    const { items } = get();
    const updatedItems = items.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  updateQuantity: (productId, quantity) => {
    const { items } = get();
    const item = items.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = item.price * quantity;
    }
    localStorage.setItem('cart', JSON.stringify(items));
    set({ items });
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [] });
  },

  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.subtotal, 0);
  }
}));

export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,

  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (order) => set({ currentOrder: order })
}));
