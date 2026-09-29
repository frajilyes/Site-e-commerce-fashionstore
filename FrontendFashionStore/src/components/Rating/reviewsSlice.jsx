import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadApi } from "../../Api/lazy";
import { normalizeReviews } from "../../utils/normalize";
import { STORAGE_KEYS } from "../../config/env";
import { readJSON, writeJSON } from "../../utils/storage";


const loadReviews = () => {
  const saved = readJSON(STORAGE_KEYS.reviews, {});
  return saved && typeof saved === "object" ? saved : {};
};

const persist = (byProduct) => writeJSON(STORAGE_KEYS.reviews, byProduct);

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async ({ productId, clothesId }, thunkAPI) => {
    if (!clothesId) return thunkAPI.rejectWithValue("Produit non synchronisé");
    try {
      const { clothesApi } = await loadApi();
      const payload = await clothesApi.getClothesReviews(clothesId);
      return { productId, reviews: normalizeReviews(payload) };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const submitProductReview = createAsyncThunk(
  "reviews/submitProductReview",
  async ({ productId, clothesId, rating, comment }, thunkAPI) => {
    if (!clothesId) return thunkAPI.rejectWithValue("Produit non synchronisé");
    try {
      const { clothesApi } = await loadApi();
      await clothesApi.createClothesReview(clothesId, { rating, comment });
      const payload = await clothesApi.getClothesReviews(clothesId);
      return { productId, reviews: normalizeReviews(payload) };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const removeProductReview = createAsyncThunk(
  "reviews/removeProductReview",
  async ({ productId, reviewId }, thunkAPI) => {
    try {
      const { reviewsApi } = await loadApi();
      await reviewsApi.deleteReview(reviewId);
      return { productId, reviewId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    byProduct: loadReviews(),
    status: "idle",
    error: null,
  },
  reducers: {
    saveReview: (state, action) => {
      const { productId, authorId, author, rating, comment } = action.payload;
      const list = state.byProduct[productId] || [];
      const existing = list.find((r) => r.authorId === authorId);

      if (existing) {
        existing.rating = rating;
        existing.comment = comment;
        existing.author = author;
        existing.date = new Date().toISOString();
        existing.edited = true;
      } else {
        list.push({
          id: `${authorId}-${Date.now()}`,
          authorId,
          author,
          rating,
          comment,
          date: new Date().toISOString(),
          edited: false,
        });
      }

      state.byProduct[productId] = list;
      persist(state.byProduct);
    },
    deleteReview: (state, action) => {
      const { productId, reviewId } = action.payload;
      const list = state.byProduct[productId] || [];
      state.byProduct[productId] = list.filter((r) => r.id !== reviewId);

      if (state.byProduct[productId].length === 0) {
        delete state.byProduct[productId];
      }
      persist(state.byProduct);
    },
    resetReviewsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const applyRemoteList = (state, action) => {
      const { productId, reviews } = action.payload;
      state.status = "succeeded";
      state.error = null;
      if (reviews.length > 0) {
        state.byProduct[productId] = reviews;
      } else {
        delete state.byProduct[productId];
      }
      persist(state.byProduct);
    };

    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProductReviews.fulfilled, applyRemoteList)
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? null;
      })

      .addCase(submitProductReview.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(submitProductReview.fulfilled, applyRemoteList)
      .addCase(submitProductReview.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Avis refusé par le serveur";
      })

      .addCase(removeProductReview.fulfilled, (state, action) => {
        const { productId, reviewId } = action.payload;
        const list = state.byProduct[productId] || [];
        state.byProduct[productId] = list.filter(
          (r) => r.reviewId !== reviewId && r.id !== reviewId,
        );
        if (state.byProduct[productId].length === 0) {
          delete state.byProduct[productId];
        }
        persist(state.byProduct);
      });
  },
});

export const selectProductReviews = (state, productId) =>
  state.reviews.byProduct[productId] || [];

export const selectUserAverage = (state, productId) => {
  const list = selectProductReviews(state, productId);
  if (!list.length) return null;
  return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
};

export const selectReviewsError = (state) => state.reviews.error;

export const { saveReview, deleteReview, resetReviewsError } =
  reviewsSlice.actions;
export default reviewsSlice.reducer;
