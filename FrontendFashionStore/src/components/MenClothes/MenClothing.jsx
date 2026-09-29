import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { addToCart } from "../../pages/Checkout/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../components/WishList/wishlistSlice";
import { setRating } from "../../components/Rating/ratingsSlice";
import StarRating from "../Rating/StarRating";
import ProductReviews from "../Rating/ProductReviews";
import {
  FaShoppingCart,
  FaHeart,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaCheck,
  FaArrowRight,
  FaRegClock,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaExpand,
  FaMinus,
  FaPlus,
  FaSearch,
} from "react-icons/fa";
import useCatalog from "../../hooks/useCatalog";
import "./MenClothing.css";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x1: Math.random() * 100,
  x2: Math.random() * 100,
  size: 2 + Math.random() * 5,
  dur: 14 + Math.random() * 16,
  delay: Math.random() * 8,
  opacity: 0.2 + Math.random() * 0.5,
}));

const CATEGORIES = [
  "All",
  "T-Shirts",
  "Shirts",
  "Pants",
  "Jeans",
  "Jackets",
  "Shoes",
  "Shorts",
  "Suits",
  "Accessories",
];

const ANIMATION_VARIANTS = {
  card: {
    hidden: { opacity: 0, y: 60, scale: 0.92 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
    }),
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
  },
  modal: {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      y: 30,
      transition: { duration: 0.25 },
    },
  },
};

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getProductSearchText = (product) =>
  normalizeText(
    [
      product.title,
      product.author,
      product.category,
      product.description,
      product.material,
      ...(product.features || []),
    ]
      .filter(Boolean)
      .join(" "),
  );

const getDiscount = (oldPrice, currentPrice) => {
  if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

const MenClothing = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();


  const wishlistItems = useSelector((state) => state.wishlist?.items ?? []);
  const userRatings = useSelector((state) => state.ratings?.userRatings ?? {});
  const cartItems = useSelector((state) => state.cart?.items ?? []);


  const searchQuery = useMemo(
    () => (searchParams.get("search") || "").trim(),
    [searchParams],
  );

  const highlightProductId = useMemo(
    () => searchParams.get("productId"),
    [searchParams],
  );


  const [activeFilter, setActiveFilter] = useState("All");
  const [animatingCart, setAnimatingCart] = useState(null);
  const [quickView, setQuickView] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [modalQty, setModalQty] = useState(1);
  const [modalSize, setModalSize] = useState(null);
  const [modalColor, setModalColor] = useState(null);
  const [modalTab, setModalTab] = useState("description");
  const [wishlistNotif, setWishlistNotif] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);


  const sortRef = useRef(null);
  const wishlistTimerRef = useRef(null);


  const allMenProducts = useMemo(
    () => products.filter((product) => product.audience === "men"),
    [products],
  );


  const filteredProducts = useMemo(() => {
    let result = [...allMenProducts];

    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

      result = result.filter((product) => {
        const searchText = getProductSearchText(product);
        return tokens.every((token) => searchText.includes(token));
      });

      if (highlightProductId) {
        const index = result.findIndex(
          (p) => String(p.id) === String(highlightProductId),
        );
        if (index > 0) {
          const [highlighted] = result.splice(index, 1);
          result.unshift(highlighted);
        }
      }
    }
    else {
      if (activeFilter !== "All") {
        result = result.filter((p) => p.category === activeFilter);
      }
    }

    const sortFunctions = {
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      popular: (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
      default: () => 0,
    };

    if (sortFunctions[sortBy]) {
      result = [...result].sort(sortFunctions[sortBy]);
    }

    return result;
  }, [allMenProducts, searchQuery, highlightProductId, activeFilter, sortBy]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );

  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 12);
  }, []);


  useEffect(() => {
    if (!searchQuery || !highlightProductId) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`product-${highlightProductId}`);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("mc-highlight");

      setTimeout(() => {
        element.classList.remove("mc-highlight");
      }, 3000);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, highlightProductId]);


  useEffect(() => {
    if (!sortOpen) return;

    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortOpen]);


  useEffect(() => {
    if (!quickView) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setQuickView(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [quickView]);


  useEffect(() => {
    if (quickView) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [quickView]);


  useEffect(() => {
    return () => {
      if (wishlistTimerRef.current) {
        clearTimeout(wishlistTimerRef.current);
      }
    };
  }, []);


  const isInWishlist = useCallback(
    (id) => wishlistItems.some((item) => item.id === id),
    [wishlistItems],
  );

  const isInCart = useCallback(
    (id) => cartItems.some((item) => item.id === id),
    [cartItems],
  );

  const showWishlistNotif = useCallback((action) => {
    if (wishlistTimerRef.current) {
      clearTimeout(wishlistTimerRef.current);
    }

    setWishlistNotif(action);

    wishlistTimerRef.current = setTimeout(() => {
      setWishlistNotif(null);
    }, 2000);
  }, []);

  const handleRateProduct = useCallback(
    (productId, rating) => {
      dispatch(setRating({ productId, rating }));
    },
    [dispatch],
  );

  const handleToggleWishlist = useCallback(
    (product) => {
      if (isInWishlist(product.id)) {
        dispatch(removeFromWishlist(product.id));
        showWishlistNotif("removed");
      } else {
        dispatch(
          addToWishlist({
            id: product.id,
            name: product.title,
            price: product.price,
            image: product.image,
            author: product.author,
            category: product.category,
            rating: product.rating,
            reviews: product.reviews,
            audience: product.audience,
          }),
        );
        showWishlistNotif("added");
      }
    },
    [dispatch, isInWishlist, showWishlistNotif],
  );

  const handleAddToCart = useCallback(
    (product) => {
      if (!product.inStock) return;

      dispatch(
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.title,
          title: product.title,
          price: product.price,
          image: product.image,
          size: product.sizes?.[0] ?? "M",
          color: product.colors?.[0] ?? "Default",
          quantity: 1,
        }),
      );

      setAnimatingCart(product.id);
      setTimeout(() => setAnimatingCart(null), 2000);
    },
    [dispatch],
  );

  const handleModalAddToCart = useCallback(() => {
    if (!quickView?.inStock) return;

    if (!modalSize && quickView.sizes?.length > 0) {
      alert("Please select a size");
      return;
    }

    if (!modalColor && quickView.colors?.length > 0) {
      alert("Please select a color");
      return;
    }

    dispatch(
      addToCart({
        id: quickView.id,
        productId: quickView.id,
        name: quickView.title,
        title: quickView.title,
        price: quickView.price,
        image: quickView.image,
        size: modalSize || "M",
        color: modalColor || "Default",
        quantity: modalQty,
      }),
    );

    setAnimatingCart(quickView.id);
    setTimeout(() => setAnimatingCart(null), 2000);
  }, [quickView, modalSize, modalColor, modalQty, dispatch]);

  const handleOpenQuickView = useCallback((product) => {
    setQuickView(product);
    setModalQty(1);
    setModalSize(product.sizes?.[0] ?? null);
    setModalColor(product.colors?.[0] ?? null);
    setModalTab("description");
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setQuickView(null);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchParams({});
    setActiveFilter("All");
    setVisibleCount(12);
  }, [setSearchParams]);

  const handleColorSelect = useCallback((color) => {
    setModalColor(color);
  }, []);

  const handleSizeSelect = useCallback((size) => {
    setModalSize(size);
  }, []);

  const handleDecreaseQty = useCallback(() => {
    setModalQty((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncreaseQty = useCallback(() => {
    setModalQty((prev) => prev + 1);
  }, []);

  return (
    <div className="mc-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="mc-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            role="status"
            aria-live="polite"
          >
            <FaHeart
              aria-hidden="true"
              className={
                wishlistNotif === "added"
                  ? "mc-toast-heart-added"
                  : "mc-toast-heart-removed"
              }
            />
            {wishlistNotif === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mc-hero">
        <div className="mc-hero-bg" aria-hidden="true" />
        <div className="mc-hero-overlay" aria-hidden="true" />
        <div className="mc-hero-gradient" aria-hidden="true" />
        <div className="mc-glow g1" aria-hidden="true" />
        <div className="mc-glow g2" aria-hidden="true" />
        <div className="mc-glow g3" aria-hidden="true" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="mc-particle"
            aria-hidden="true"
            initial={{ y: "-10%", x: `${p.x1}%` }}
            animate={{ y: ["-10%", "110%"], x: [`${p.x1}%`, `${p.x2}%`] }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
            style={{
              left: 0,
              top: 0,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
            }}
          />
        ))}

        <div className="mc-hero-content">
          <motion.div
            className="mc-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="mc-tag-dot" aria-hidden="true" />
            Men's Collection 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Discover Premium
            <br />
            <span className="mc-neon">Men's Fashion</span>
          </motion.h1>

          <motion.p
            className="mc-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Curated collection of premium menswear from world-class brands.
            <br />
            Elevate your style. Define your identity.
          </motion.p>

          <motion.div
            className="mc-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="mc-feature">
              <FaTruck aria-hidden="true" /> Free Shipping
            </div>
            <div className="mc-feature">
              <FaShieldAlt aria-hidden="true" /> Secure Payment
            </div>
            <div className="mc-feature">
              <FaUndo aria-hidden="true" /> Easy Returns
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {searchQuery && (
          <motion.div
            className="mc-search-info-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            role="status"
            aria-live="polite"
          >
            <div className="mc-search-info-content">
              <FaSearch className="mc-search-info-icon" aria-hidden="true" />
              <span>
                Showing results for: <strong>"{searchQuery}"</strong>
              </span>
              <span className="mc-search-info-count">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <button
              className="mc-search-clear-btn"
              onClick={handleClearSearch}
              type="button"
              aria-label="Clear search results"
            >
              <FaTimes aria-hidden="true" /> Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mc-filter-bar" aria-label="Product filters">
        <div className="mc-filter-row">
          <div className="mc-filter-left">
            <FaFilter className="mc-filter-icon" aria-hidden="true" />

            {searchQuery && (
              <div className="mc-filter-search-mode">
                <FaSearch
                  style={{ marginRight: "8px", fontSize: "12px" }}
                  aria-hidden="true"
                />
                <span>
                  Filtering by search: <strong>"{searchQuery}"</strong>
                </span>
              </div>
            )}

            <div
              className="mc-chips"
              role="group"
              aria-label="Category filters"
            >
              {CATEGORIES.map((category) => (
                <motion.button
                  key={category}
                  className={[
                    "mc-chip",
                    activeFilter === category ? "active" : "",
                    searchQuery ? "disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (!searchQuery) {
                      setActiveFilter(category);
                      setVisibleCount(12);
                    }
                  }}
                  whileHover={{ scale: searchQuery ? 1 : 1.05 }}
                  whileTap={{ scale: searchQuery ? 1 : 0.95 }}
                  disabled={!!searchQuery}
                  type="button"
                  aria-pressed={activeFilter === category}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mc-filter-right">
            <div className="mc-sort-wrap" ref={sortRef}>
              <button
                className="mc-sort-btn"
                onClick={() => setSortOpen((prev) => !prev)}
                type="button"
                aria-label="Sort products"
                aria-expanded={sortOpen}
                aria-haspopup="listbox"
              >
                Sort By <FaChevronDown aria-hidden="true" />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.ul
                    className="mc-sort-drop"
                    role="listbox"
                    aria-label="Sort options"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {[
                      { value: "default", label: "Default" },
                      { value: "low", label: "Price: Low → High" },
                      { value: "high", label: "Price: High → Low" },
                      { value: "rating", label: "Best Rating" },
                      { value: "popular", label: "Most Popular" },
                    ].map((option) => (
                      <li
                        key={option.value}
                        className={[
                          "mc-sort-item",
                          sortBy === option.value ? "active" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortOpen(false);
                          setVisibleCount(12);
                        }}
                        role="option"
                        aria-selected={sortBy === option.value}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSortBy(option.value);
                            setSortOpen(false);
                            setVisibleCount(12);
                          }
                        }}
                      >
                        {option.label}
                        {sortBy === option.value && (
                          <FaCheck aria-hidden="true" />
                        )}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <span className="mc-count" aria-live="polite">
              <span>{filteredProducts.length}</span> products
            </span>
          </div>
        </div>
      </section>

      <section className="mc-grid-section" aria-label="Products grid">
        <motion.div className="mc-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              visibleProducts.map((product, index) => (
                <motion.article
                  className="mc-card"
                  key={product.id}
                  id={`product-${product.id}`}
                  variants={ANIMATION_VARIANTS.card}
                  initial="hidden"
                  whileInView="visible"
                  exit="exit"
                  viewport={{ once: true }}
                  custom={index}
                  layout
                  aria-label={product.title}
                >
                  <div className="mc-card-img">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      width="500"
                      height="500"
                    />

                    {product.badge && (
                      <span
                        className="mc-badge"
                        style={{ background: product.badgeColor }}
                        aria-label={`Badge: ${product.badge}`}
                      >
                        {product.badge}
                      </span>
                    )}

                    {product.oldPrice && (
                      <span
                        className="mc-discount-tag"
                        aria-label={`${getDiscount(
                          product.oldPrice,
                          product.price,
                        )}% discount`}
                      >
                        -{getDiscount(product.oldPrice, product.price)}%
                      </span>
                    )}

                    {!product.inStock && (
                      <div className="mc-sold-out" aria-label="Out of stock">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`mc-heart ${
                        isInWishlist(product.id) ? "liked" : ""
                      }`}
                      onClick={() => handleToggleWishlist(product)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      aria-label={
                        isInWishlist(product.id)
                          ? `Remove ${product.title} from wishlist`
                          : `Add ${product.title} to wishlist`
                      }
                      aria-pressed={isInWishlist(product.id)}
                      title={
                        isInWishlist(product.id)
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                      }
                    >
                      <FaHeart aria-hidden="true" />
                    </motion.button>
                  </div>

                  <div className="mc-card-body">
                    <div className="mc-card-author">
                      <span className="mc-brand-dot" aria-hidden="true" />
                      {product.author || "Brand"}
                    </div>

                    <h3 className="mc-card-title">{product.title}</h3>

                    <span className="mc-card-cat">
                      {product.subCategory || product.category}
                    </span>

                    <p className="mc-card-desc">
                      {product.description
                        ? `${product.description.substring(0, 80)}...`
                        : "Premium quality product"}
                    </p>

                    <div className="mc-card-rating-wrapper">
                      <StarRating
                        currentRating={product.rating || 0}
                        userRating={userRatings[product.id] ?? null}
                        onRate={(rating) =>
                          handleRateProduct(product.id, rating)
                        }
                        readonly={false}
                        showLabel={false}
                        size="small"
                      />
                      <span className="mc-rating-reviews">
                        {product.reviews || 0} reviews
                      </span>
                    </div>

                    {product.colors && product.colors.length > 0 && (
                      <div
                        className="mc-card-colors"
                        aria-label={`${product.colors.length} color options available`}
                      >
                        {product.colors.map((color, idx) => (
                          <span
                            key={idx}
                            className="mc-color-mini"
                            style={{ background: color }}
                            aria-label={`Color option ${idx + 1}`}
                            title={`Color option ${idx + 1}`}
                          />
                        ))}
                        <span className="mc-color-count" aria-hidden="true">
                          {product.colors.length} colors
                        </span>
                      </div>
                    )}

                    <div className="mc-sold-info">
                      <FaRegClock aria-hidden="true" />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="mc-card-price">
                      <span className="mc-price-now">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.oldPrice && (
                        <>
                          <span className="mc-price-was">
                            ${product.oldPrice.toFixed(2)}
                          </span>
                          <span className="mc-save-tag">
                            Save $
                            {(product.oldPrice - product.price).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mc-card-btns">
                      <motion.button
                        className={`mc-add-btn ${
                          animatingCart === product.id || isInCart(product.id)
                            ? "added"
                            : ""
                        }`}
                        onClick={() => handleAddToCart(product)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!product.inStock}
                        type="button"
                        aria-label={
                          animatingCart === product.id || isInCart(product.id)
                            ? `${product.title} added to cart`
                            : `Add ${product.title} to cart`
                        }
                      >
                        {animatingCart === product.id ||
                        isInCart(product.id) ? (
                          <>
                            <FaCheck aria-hidden="true" /> Added
                          </>
                        ) : (
                          <>
                            <FaShoppingCart aria-hidden="true" /> Add to Cart
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        className="mc-view-btn"
                        onClick={() => handleOpenQuickView(product)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        aria-label={`Quick view ${product.title}`}
                      >
                        <FaExpand aria-hidden="true" />
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <motion.div
                className="mc-no-results"
                key="no-results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                role="status"
                aria-live="polite"
                style={{ textAlign: "center", padding: "40px" }}
              >
                <FaSearch
                  className="mc-no-results-icon"
                  aria-hidden="true"
                  style={{ fontSize: "48px", color: "#666" }}
                />
                <h3>No product found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "Try selecting a different category."}
                </p>
                {searchQuery && (
                  <button
                    className="mc-clear-search-btn"
                    onClick={handleClearSearch}
                    type="button"
                    aria-label="Clear search"
                  >
                    <FaTimes aria-hidden="true" /> Clear Search
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {hasMore && (
          <div className="mc-load-more">
            <motion.button
              className="mc-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Load more products"
              onClick={handleLoadMore}
            >
              Load More Products <FaArrowRight aria-hidden="true" />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="mc-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseQuickView}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${quickView.title}`}
          >
            <motion.div
              className="mc-modal"
              variants={ANIMATION_VARIANTS.modal}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="mc-modal-close"
                onClick={handleCloseQuickView}
                type="button"
                aria-label="Close quick view modal"
              >
                <FaTimes aria-hidden="true" />
              </button>

              <div className="mc-modal-grid">
                <div className="mc-modal-img">
                  <img
                    src={quickView.image}
                    alt={quickView.title}
                    loading="lazy"
                    width="500"
                    height="500"
                  />
                  {quickView.badge && (
                    <span
                      className="mc-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                </div>

                <div className="mc-modal-info">
                  <div className="mc-card-author">
                    <span className="mc-brand-dot" aria-hidden="true" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>
                  <span className="mc-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div
                    className="mc-modal-rating-wrapper"
                    style={{ margin: "12px 0" }}
                  >
                    <StarRating
                      currentRating={quickView.rating || 0}
                      userRating={userRatings[quickView.id] ?? null}
                      onRate={(rating) =>
                        handleRateProduct(quickView.id, rating)
                      }
                      readonly={false}
                      showLabel={true}
                      size="medium"
                    />
                  </div>

                  <div className="mc-card-price" style={{ margin: "10px 0" }}>
                    <span className="mc-price-now">
                      ${quickView.price.toFixed(2)}
                    </span>
                    {quickView.oldPrice && (
                      <>
                        <span className="mc-price-was">
                          ${quickView.oldPrice.toFixed(2)}
                        </span>
                        <span className="mc-save-tag">
                          -{getDiscount(quickView.oldPrice, quickView.price)}%
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mc-modal-tabs" role="tablist">
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`mc-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                        type="button"
                        role="tab"
                        aria-selected={modalTab === tab}
                        id={`tab-${tab}`}
                        aria-controls={`tabpanel-${tab}`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div
                    className="mc-tab-content"
                    role="tabpanel"
                    id={`tabpanel-${modalTab}`}
                    aria-labelledby={`tab-${modalTab}`}
                  >
                    {modalTab === "reviews" && (
                      <ProductReviews
                        key={quickView.id}
                        productId={quickView.id}
                        baseRating={quickView.rating || 0}
                        baseCount={quickView.reviews || 0}
                      />
                    )}
                    {modalTab === "description" && (
                      <p>
                        {quickView.description ||
                          "Premium quality men's clothing."}
                      </p>
                    )}
                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "Not specified"}
                        </li>
                        <li>
                          <strong>Category:</strong>{" "}
                          {quickView.subCategory || quickView.category}
                        </li>
                        <li>
                          <strong>Brand:</strong> {quickView.author || "Brand"}
                        </li>
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount || 0).toLocaleString()} units
                        </li>
                      </ul>
                    )}
                    {modalTab === "shipping" && (
                      <ul>
                        <li>
                          <FaTruck aria-hidden="true" /> Free shipping on orders
                          over $50
                        </li>
                        <li>
                          <FaUndo aria-hidden="true" /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt aria-hidden="true" /> 1-year warranty
                          included
                        </li>
                        <li>
                          <FaCheck aria-hidden="true" /> Authentic products
                          guaranteed
                        </li>
                      </ul>
                    )}
                  </div>

                  {quickView.colors && quickView.colors.length > 0 && (
                    <div className="mc-modal-section">
                      <h4 id="color-label">Color</h4>
                      <div
                        className="mc-modal-colors"
                        role="group"
                        aria-labelledby="color-label"
                      >
                        {quickView.colors.map((color, idx) => (
                          <button
                            key={idx}
                            className={`mc-modal-color ${
                              modalColor === color ? "selected" : ""
                            }`}
                            style={{ background: color }}
                            onClick={() => handleColorSelect(color)}
                            type="button"
                            aria-label={`Color option ${idx + 1}`}
                            aria-pressed={modalColor === color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {quickView.sizes && quickView.sizes.length > 0 && (
                    <div className="mc-modal-section">
                      <h4 id="size-label">Size</h4>
                      <div
                        className="mc-modal-sizes"
                        role="group"
                        aria-labelledby="size-label"
                      >
                        {quickView.sizes.map((size) => (
                          <button
                            key={size}
                            className={`mc-modal-size ${
                              modalSize === size ? "selected" : ""
                            }`}
                            onClick={() => handleSizeSelect(size)}
                            type="button"
                            aria-pressed={modalSize === size}
                            aria-label={`Size ${size}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mc-modal-section">
                    <h4 id="qty-label">Quantity</h4>
                    <div
                      className="mc-qty"
                      role="group"
                      aria-labelledby="qty-label"
                    >
                      <button
                        onClick={handleDecreaseQty}
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={modalQty <= 1}
                      >
                        <FaMinus aria-hidden="true" />
                      </button>
                      <span
                        aria-live="polite"
                        aria-atomic="true"
                        aria-label={`Quantity: ${modalQty}`}
                      >
                        {modalQty}
                      </span>
                      <button
                        onClick={handleIncreaseQty}
                        type="button"
                        aria-label="Increase quantity"
                      >
                        <FaPlus aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mc-modal-total">
                    Total:{" "}
                    <span aria-live="polite" aria-atomic="true">
                      ${(quickView.price * modalQty).toFixed(2)}
                    </span>
                  </div>

                  <div className="mc-modal-actions">
                    <motion.button
                      className="mc-modal-cart"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        handleModalAddToCart();
                        setQuickView(null);
                      }}
                      disabled={!quickView.inStock}
                      type="button"
                      aria-label={`Add ${quickView.title} to cart`}
                    >
                      <FaShoppingCart aria-hidden="true" /> Add to Cart
                    </motion.button>

                    <motion.button
                      className={`mc-modal-wish ${
                        isInWishlist(quickView.id) ? "wished" : ""
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleWishlist(quickView)}
                      type="button"
                      aria-label={
                        isInWishlist(quickView.id)
                          ? `Remove ${quickView.title} from wishlist`
                          : `Add ${quickView.title} to wishlist`
                      }
                      aria-pressed={isInWishlist(quickView.id)}
                      title={
                        isInWishlist(quickView.id)
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                      }
                    >
                      <FaHeart
                        aria-hidden="true"
                        className={
                          isInWishlist(quickView.id) ? "liked-icon" : ""
                        }
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenClothing;
