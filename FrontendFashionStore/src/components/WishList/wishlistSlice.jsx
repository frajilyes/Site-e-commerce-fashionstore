import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadApi } from "../../Api/lazy";
import { toArray, normalizeProduct } from "../../utils/normalize";
import { STORAGE_KEYS } from "../../config/env";
import {
  readJSON,
  writeJSON,
  getWishlistId,
  setWishlistId,
} from "../../utils/storage";


const loadWishlistFromStorage = () => {
  const stored = readJSON(STORAGE_KEYS.wishlist, []);
  return Array.isArray(stored) ? stored : [];
};

const saveWishlistToStorage = (items) => writeJSON(STORAGE_KEYS.wishlist, items);

const resolveClothesIds = (items, catalogue) =>
  items
    .map((item) => {
      if (item?._id) return item._id;
      const match = catalogue.find(
        (product) => String(product?.id) === String(item?.id),
      );
      return match?._id ?? null;
    })
    .filter(Boolean);

const toWishlistEntry = (product) => ({
  id: product.id,
  _id: product._id ?? null,
  name: product.title,
  price: product.price,
  image: product.image,
  author: product.author,
  category: product.subCategory || product.category,
  rating: product.rating,
  reviews: product.reviews,
  addedDate: new Date().toISOString(),
});

export const syncWishlist = createAsyncThunk(
  "wishlist/sync",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const userId = state.auth?.user?.id ?? state.auth?.user?._id ?? null;
    if (!userId) return rejectWithValue("Not authenticated");

    const clothes = resolveClothesIds(
      state.wishlist.items,
      state.products?.items ?? [],
    );

    try {
      const { wishlistApi } = await loadApi();
      const existingId = getWishlistId();
      const saved = existingId
        ? await wishlistApi.updateWishlist(existingId, { user: userId, clothes })
        : await wishlistApi.createWishlist({ user: userId, clothes });

      if (saved?._id) setWishlistId(saved._id);
      return saved?._id ?? existingId ?? null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_, { getState, rejectWithValue }) => {
    const wishlistId = getWishlistId();
    if (!wishlistId) return rejectWithValue("No remote wishlist yet");

    try {
      const { wishlistApi } = await loadApi();
      const doc = await wishlistApi.getWishlistById(wishlistId);
      const catalogue = getState().products?.items ?? [];

      return toArray(doc?.clothes)
        .map((entry) => {
          if (entry && typeof entry === "object") {
            return toWishlistEntry(normalizeProduct(entry));
          }
          const match = catalogue.find(
            (product) => String(product?._id) === String(entry),
          );
          return match ? toWishlistEntry(match) : null;
        })
        .filter(Boolean);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: loadWishlistFromStorage(),
    syncStatus: "idle",
    syncError: null,
  },
  reducers: {
    addToWishlist: (state, action) => {
      const exists = state.items.some(
        (item) => String(item.id) === String(action.payload.id),
      );
      if (!exists) {
        state.items.push({
          ...action.payload,
          addedDate: new Date().toISOString(),
        });
        saveWishlistToStorage(state.items);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(
        (item) => String(item.id) !== String(action.payload),
      );
      saveWishlistToStorage(state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      saveWishlistToStorage(state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncWishlist.pending, (state) => {
        state.syncStatus = "loading";
        state.syncError = null;
      })
      .addCase(syncWishlist.fulfilled, (state) => {
        state.syncStatus = "succeeded";
      })
      .addCase(syncWishlist.rejected, (state, action) => {
        state.syncStatus = "failed";
        state.syncError = action.payload ?? null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        const remote = action.payload ?? [];
        const known = new Set(state.items.map((item) => String(item.id)));
        remote.forEach((entry) => {
          if (!known.has(String(entry.id))) state.items.push(entry);
        });
        saveWishlistToStorage(state.items);
        state.syncStatus = "succeeded";
      });
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } =
  wishlistSlice.actions;

export const selectWishlistItems = (state) => state.wishlist.items;
export const selectIsInWishlist = (state, id) =>
  state.wishlist.items.some((item) => String(item.id) === String(id));

export default wishlistSlice.reducer;
