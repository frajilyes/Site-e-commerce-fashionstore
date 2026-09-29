import { createSlice } from "@reduxjs/toolkit";

const loadRatings = () => {
  try {
    const saved = localStorage.getItem("capsRatings");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    userRatings: loadRatings(),
  },
  reducers: {
    setRating: (state, action) => {
      const { productId, rating } = action.payload;
      state.userRatings[productId] = rating;

      try {
        localStorage.setItem("capsRatings", JSON.stringify(state.userRatings));
      } catch (error) {
        console.error("Failed to save rating:", error);
      }
    },
    removeRating: (state, action) => {
      const productId = action.payload;
      delete state.userRatings[productId];

      try {
        localStorage.setItem("capsRatings", JSON.stringify(state.userRatings));
      } catch (error) {
        console.error("Failed to remove rating:", error);
      }
    },
  },
});

export const { setRating, removeRating } = ratingsSlice.actions;
export default ratingsSlice.reducer;
