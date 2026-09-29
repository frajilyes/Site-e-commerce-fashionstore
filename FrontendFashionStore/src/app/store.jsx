import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "../pages/Checkout/cartSlice";
import wishlistReducer from "../components/WishList/wishlistSlice";
import authReducer from "../pages/Auth/authSlice";
import ratingsReducer from "../components/Rating/ratingsSlice";
import reviewsReducer from "../components/Rating/reviewsSlice";
import productsReducer from "../features/products/productsSlice";
import ordersReducer from "../features/orders/ordersSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    auth: authReducer,
    ratings: ratingsReducer,
    reviews: reviewsReducer,
    products: productsReducer,
    orders: ordersReducer,
  },
});

export default store;
