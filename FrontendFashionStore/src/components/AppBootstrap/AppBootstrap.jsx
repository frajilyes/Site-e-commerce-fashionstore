import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UNAUTHORIZED_EVENT } from "../../Api/events";
import { afterPaint } from "../../utils/afterPaint";
import { fetchProducts } from "../../features/products/productsSlice";
import { fetchCurrentUser, logout } from "../../pages/Auth/authSlice";
import { fetchWishlist, syncWishlist } from "../WishList/wishlistSlice";
import { getToken } from "../../utils/storage";

const AppBootstrap = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const catalogueStatus = useSelector((state) => state.products.status);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  useEffect(() => {
    if (catalogueStatus !== "idle") return undefined;
    return afterPaint(() => dispatch(fetchProducts()));
  }, [dispatch, catalogueStatus]);

  useEffect(() => {
    if (!getToken()) return undefined;
    return afterPaint(() => dispatch(fetchCurrentUser()));
  }, [dispatch]);

  useEffect(() => {
    const onUnauthorized = () => dispatch(logout());
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && catalogueStatus !== "idle") {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated, catalogueStatus]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const timer = setTimeout(() => dispatch(syncWishlist()), 800);
    return () => clearTimeout(timer);
  }, [dispatch, isAuthenticated, wishlistItems]);

  return null;
};

export default AppBootstrap;
