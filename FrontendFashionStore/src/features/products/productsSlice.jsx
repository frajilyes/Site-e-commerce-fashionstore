import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadApi } from "../../Api/lazy";
import { normalizeProduct, normalizeProducts } from "../../utils/normalize";


export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (filters = {}, thunkAPI) => {
    try {
      const { clothesApi } = await loadApi();
      const payload = await clothesApi.getClothes(filters);
      return normalizeProducts(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
  {
    condition: (_filters, { getState }) =>
      getState().products.status !== "loading",
  },
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id, thunkAPI) => {
    try {
      const { clothesApi } = await loadApi();
      const payload = await clothesApi.getClothesById(id);
      return normalizeProduct(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    selected: null,
    status: "idle",
    error: null,
    source: "none",
    lastFetchedAt: null,
  },
  reducers: {
    clearSelectedProduct: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastFetchedAt = Date.now();
        if (action.payload.length > 0) {
          state.items = action.payload;
          state.source = "api";
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Catalogue indisponible";
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.selected = action.payload;
      });
  },
});

export const { clearSelectedProduct } = productsSlice.actions;

export const selectAllProducts = (state) => state.products.items;
export const selectProductsStatus = (state) => state.products.status;
export const selectCatalogSource = (state) => state.products.source;

export const selectProductById = (state, id) =>
  state.products.items.find((product) => String(product.id) === String(id)) ??
  null;

export const selectProductsByAudience = (state, audience) =>
  state.products.items.filter(
    (product) =>
      String(product.audience).toLowerCase() === String(audience).toLowerCase(),
  );

export const selectProductsByCategory = (state, category) =>
  state.products.items.filter(
    (product) =>
      String(product.category).toLowerCase() === String(category).toLowerCase(),
  );

export default productsSlice.reducer;
