import { createSlice } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "../../config/env";
import { readJSON, writeJSON } from "../../utils/storage";

const loadCart = () => {
  const stored = readJSON(STORAGE_KEYS.cart, []);
  return Array.isArray(stored) ? stored : [];
};

const persist = (items) => writeJSON(STORAGE_KEYS.cart, items);

const sameLine = (a, b) =>
  String(a.id) === String(b.id) && a.size === b.size && a.color === b.color;

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadCart(),
  },
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existing = state.items.find((item) => sameLine(item, newItem));
      if (existing) {
        existing.quantity += newItem.quantity || 1;
      } else {
        state.items.push({ ...newItem, quantity: newItem.quantity || 1 });
      }
      persist(state.items);
    },
    removeFromCart: (state, action) => {
      const { id, size, color } = action.payload;
      state.items = state.items.filter(
        (item) => !sameLine(item, { id, size, color }),
      );
      persist(state.items);
    },
    updateQuantity: (state, action) => {
      const { id, size, color, quantity } = action.payload;
      const item = state.items.find((entry) =>
        sameLine(entry, { id, size, color }),
      );
      if (item) {
        item.quantity = quantity;
        persist(state.items);
      }
    },
    clearCart: (state) => {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

export const selectCartSubtotal = (state) =>
  state.cart.items.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

export default cartSlice.reducer;
