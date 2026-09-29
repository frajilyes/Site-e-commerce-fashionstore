import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productsSlice";

export const useCatalog = (filters = {}) => {
  const dispatch = useDispatch();
  const { items, status, error, source } = useSelector((state) => state.products);

  const { audience, category, subCategory, keyword } = filters;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  const products = useMemo(() => {
    const matches = (value, expected) =>
      !expected ||
      String(value ?? "").toLowerCase() === String(expected).toLowerCase();

    const needle = String(keyword ?? "").toLowerCase().trim();

    return items.filter(
      (product) =>
        matches(product.audience, audience) &&
        matches(product.category, category) &&
        matches(product.subCategory, subCategory) &&
        (!needle ||
          `${product.title} ${product.author} ${product.category} ${product.subCategory}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [items, audience, category, subCategory, keyword]);

  return {
    products,
    allProducts: items,
    loading: status === "loading",
    error,
    source,
  };
};

export default useCatalog;
