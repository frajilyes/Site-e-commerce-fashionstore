import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  FaShoePrints,
  FaSearch,
} from "react-icons/fa";
import useCatalog from "../../hooks/useCatalog";
import "./KidsShoes.css";

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
  "Sneakers",
  "School Shoes",
  "Sandals",
  "Boots",
  "Sports Shoes",
  "Party Shoes",
  "Slip-Ons",
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

const normalizeText = (value = "") => {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const getProductSearchText = (product) => {
  return normalizeText(
    [
      product.title,
      product.brand,
      product.author,
      product.category,
      product.subCategory,
      product.description,
      product.material,
      ...(Array.isArray(product.features) ? product.features : []),
    ]
      .filter(Boolean)
      .join(" "),
  );
};

const getDiscount = (oldPrice, currentPrice) => {
  if (
    oldPrice == null ||
    currentPrice == null ||
    isNaN(oldPrice) ||
    isNaN(currentPrice) ||
    oldPrice <= currentPrice
  )
    return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

const KidsShoes = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const wishlistItems = useSelector((state) => state.wishlist?.items ?? []);
  const userRatings = useSelector((state) => state.ratings?.userRatings ?? {});

  const searchQuery = useMemo(
    () => (searchParams.get("search") || "").trim(),
    [searchParams],
  );

  const highlightProductId = useMemo(
    () => searchParams.get("productId"),
    [searchParams],
  );

  const [activeFilter, setActiveFilter] = useState("All");
  const [addedToCart, setAddedToCart] = useState([]);
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
  const cartTimersRef = useRef(new Map());

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(
      (product) =>
        product.audience === "kids" &&
        (product.category === "Shoes" || product.category === "Kids Shoes"),
    );

    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

      filtered = filtered.filter((product) => {
        const searchText = getProductSearchText(product);
        return tokens.every((token) => searchText.includes(token));
      });

      if (highlightProductId) {
        const highlightedIndex = filtered.findIndex(
          (p) => String(p.id) === String(highlightProductId),
        );

        if (highlightedIndex > 0) {
          const [highlighted] = filtered.splice(highlightedIndex, 1);
          filtered.unshift(highlighted);
        }
      }
    }
    else if (activeFilter !== "All") {
      filtered = filtered.filter(
        (p) => p.subCategory === activeFilter || p.category === activeFilter,
      );
    }

    const sortFunctions = {
      low: (a, b) => (a.price ?? 0) - (b.price ?? 0),
      high: (a, b) => (b.price ?? 0) - (a.price ?? 0),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      popular: (a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0),
      default: () => 0,
    };

    const sortFn = sortFunctions[sortBy];
    return sortFn ? [...filtered].sort(sortFn) : filtered;
  }, [products, searchQuery, highlightProductId, activeFilter, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const handleLoadMore = () => setVisibleCount((prev) => prev + 12);

  useEffect(() => {
    if (!searchQuery || !highlightProductId) return;

    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(`product-${highlightProductId}`);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ks-highlight");

      const removeTimer = setTimeout(() => {
        element.classList.remove("ks-highlight");
      }, 3000);

      scrollTimer.__removeTimer = removeTimer;
    }, 500);

    return () => {
      clearTimeout(scrollTimer);
      if (scrollTimer.__removeTimer) {
        clearTimeout(scrollTimer.__removeTimer);
      }
    };
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
    document.body.style.overflow = quickView ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [quickView]);

  useEffect(() => {
    return () => {
      if (wishlistTimerRef.current !== null) {
        clearTimeout(wishlistTimerRef.current);
        wishlistTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timersMap = cartTimersRef.current;
    return () => {
      timersMap.forEach((timerId) => clearTimeout(timerId));
      timersMap.clear();
    };
  }, []);

  const handleRateProduct = useCallback(
    (productId, rating) => {
      dispatch(setRating({ productId, rating }));
    },
    [dispatch],
  );

  const showWishlistNotif = useCallback((action) => {
    if (wishlistTimerRef.current !== null) {
      clearTimeout(wishlistTimerRef.current);
    }

    setWishlistNotif(action);

    wishlistTimerRef.current = setTimeout(() => {
      setWishlistNotif(null);
      wishlistTimerRef.current = null;
    }, 2000);
  }, []);

  const handleToggleWishlist = useCallback(
    (product) => {
      const alreadyInWishlist = wishlistItems.some(
        (item) => item.id === product.id,
      );

      if (alreadyInWishlist) {
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
    [dispatch, showWishlistNotif, wishlistItems],
  );

  const addProductToCartFeedback = useCallback((productId) => {
    const existingTimer = cartTimersRef.current.get(productId);

    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
    }

    setAddedToCart((prev) =>
      prev.includes(productId) ? prev : [...prev, productId],
    );

    const timerId = setTimeout(() => {
      setAddedToCart((prev) => prev.filter((id) => id !== productId));
      cartTimersRef.current.delete(productId);
    }, 2000);

    cartTimersRef.current.set(productId, timerId);
  }, []);

  const handleAddToCart = useCallback(
    (product) => {
      if (!product?.inStock) return;

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

      addProductToCartFeedback(product.id);
    },
    [dispatch, addProductToCartFeedback],
  );

  const handleModalAddToCart = useCallback(() => {
    if (!quickView?.inStock) return;

    if (!modalSize) {
      alert("Please select a size");
      return;
    }

    if (!modalColor) {
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
        size: modalSize,
        color: modalColor,
        quantity: modalQty,
      }),
    );

    addProductToCartFeedback(quickView.id);
  }, [
    quickView,
    modalSize,
    modalColor,
    modalQty,
    dispatch,
    addProductToCartFeedback,
  ]);

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

  const isInWishlist = useCallback(
    (id) => wishlistItems.some((item) => item.id === id),
    [wishlistItems],
  );

  const isProductAdded = useCallback(
    (productId) => addedToCart.includes(productId),
    [addedToCart],
  );

  return (
    <div className="ks-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="ks-wishlist-toast"
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
                  ? "ks-toast-heart-added"
                  : "ks-toast-heart-removed"
              }
            />
            {wishlistNotif === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="ks-hero">
        <div className="ks-hero-bg" aria-hidden="true" />
        <div className="ks-hero-overlay" aria-hidden="true" />
        <div className="ks-hero-gradient" aria-hidden="true" />
        <div className="ks-glow kg1" aria-hidden="true" />
        <div className="ks-glow kg2" aria-hidden="true" />
        <div className="ks-glow kg3" aria-hidden="true" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="ks-particle"
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

        <div className="ks-hero-content">
          <motion.div
            className="ks-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <FaShoePrints className="ks-tag-icon" />
            Kids Shoes Collection 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Tiny Steps,
            <br />
            <span className="ks-neon">Big Adventures</span>
          </motion.h1>

          <motion.p
            className="ks-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Discover colorful sneakers, comfy school shoes, playful sandals, and
            sporty trainers.
            <br />
            Built for fun, comfort, and every little adventure.
          </motion.p>

          <motion.div
            className="ks-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="ks-feat">
              <FaTruck aria-hidden="true" /> Free Shipping
            </div>
            <div className="ks-feat">
              <FaShieldAlt aria-hidden="true" /> Kid-Friendly Comfort
            </div>
            <div className="ks-feat">
              <FaUndo aria-hidden="true" /> Easy Returns
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {searchQuery && (
          <motion.div
            className="ks-search-info-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            role="status"
            aria-live="polite"
          >
            <div className="ks-search-info-content">
              <FaSearch className="ks-search-info-icon" aria-hidden="true" />
              <span>
                Showing results for: <strong>"{searchQuery}"</strong>
              </span>
              <span className="ks-search-info-count">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <button
              className="ks-search-clear-btn"
              onClick={handleClearSearch}
              type="button"
              aria-label="Clear search results"
            >
              <FaTimes aria-hidden="true" /> Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="ks-filter-bar" aria-label="Product filters">
        <div className="ks-filter-row">
          <div className="ks-filter-left">
            <FaFilter className="ks-filter-icon" aria-hidden="true" />

            {searchQuery && (
              <div className="ks-filter-search-mode">
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
              className="ks-chips"
              role="group"
              aria-label="Category filters"
            >
              {CATEGORIES.map((category) => (
                <motion.button
                  key={category}
                  className={[
                    "ks-chip",
                    activeFilter === category ? "active" : "",
                    searchQuery ? "disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (!searchQuery) setActiveFilter(category); setVisibleCount(12);
                  }}
                  whileHover={{ scale: searchQuery ? 1 : 1.05 }}
                  whileTap={{ scale: searchQuery ? 1 : 0.95 }}
                  disabled={!!searchQuery}
                  type="button"
                  aria-pressed={activeFilter === category}
                  aria-disabled={!!searchQuery}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="ks-filter-right">
            <div className="ks-sort-wrap" ref={sortRef}>
              <button
                className="ks-sort-btn"
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
                    className="ks-sort-drop"
                    role="listbox"
                    aria-label="Sort options"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {[
                      { value: "default", label: "Default" },
                      {
                        value: "low",
                        label: "Price: Low → High",
                      },
                      {
                        value: "high",
                        label: "Price: High → Low",
                      },
                      { value: "rating", label: "Best Rating" },
                      {
                        value: "popular",
                        label: "Most Popular",
                      },
                    ].map((option) => (
                      <li
                        key={option.value}
                        className={[
                          "ks-sort-item",
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

            <span className="ks-count" aria-live="polite">
              <span>{filteredProducts.length}</span> products
            </span>
          </div>
        </div>
      </section>

      <section className="ks-grid-section" aria-label="Products grid">
        <motion.div className="ks-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              visibleProducts.map((product, index) => (
                <motion.article
                  className="ks-card"
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
                  <div className="ks-card-img">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      width="500"
                      height="500"
                    />

                    {product.badge && (
                      <span
                        className="ks-badge"
                        style={{
                          background: product.badgeColor,
                        }}
                        aria-label={`Badge: ${product.badge}`}
                      >
                        {product.badge}
                      </span>
                    )}

                    {product.oldPrice && (
                      <span
                        className="ks-discount-tag"
                        aria-label={`${getDiscount(
                          product.oldPrice,
                          product.price,
                        )}% discount`}
                      >
                        -{getDiscount(product.oldPrice, product.price)}%
                      </span>
                    )}

                    {!product.inStock && (
                      <div className="ks-sold-out" aria-label="Out of stock">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`ks-heart ${
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
                    >
                      <FaHeart aria-hidden="true" />
                    </motion.button>

                    <motion.button
                      className="ks-quick-view-btn"
                      onClick={() => handleOpenQuickView(product)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      aria-label={`Quick view ${product.title}`}
                    >
                      <FaExpand aria-hidden="true" />
                    </motion.button>
                  </div>

                  <div className="ks-card-body">
                    <div className="ks-card-author">
                      <span className="ks-brand-dot" aria-hidden="true" />
                      {product.author}
                    </div>

                    <h3 className="ks-card-title">{product.title}</h3>

                    <span className="ks-card-cat">
                      {product.subCategory || product.category}
                    </span>

                    <p className="ks-card-desc">
                      {product.description
                        ? `${product.description.substring(0, 85)}...`
                        : "Premium quality product"}
                    </p>

                    <div className="ks-card-rating-wrapper">
                      <StarRating
                        currentRating={product.rating ?? 0}
                        userRating={userRatings[product.id] ?? null}
                        onRate={(rating) =>
                          handleRateProduct(product.id, rating)
                        }
                        readonly={false}
                        showLabel={false}
                        size="small"
                      />
                      <span className="ks-rating-reviews">
                        {product.reviews ?? 0} reviews
                      </span>
                    </div>

                    {Array.isArray(product.colors) &&
                      product.colors.length > 0 && (
                        <div
                          className="ks-card-colors"
                          aria-label={`${product.colors.length} color options available`}
                        >
                          {product.colors.map((c, ci) => (
                            <span
                              key={ci}
                              className="ks-color-dot"
                              style={{ background: c }}
                              aria-label={`Color option ${ci + 1}: ${c}`}
                              title={c}
                            />
                          ))}
                          <span className="ks-color-label" aria-hidden="true">
                            {product.colors.length} colors
                          </span>
                        </div>
                      )}

                    <div className="ks-sold-info">
                      <FaRegClock aria-hidden="true" />
                      <span>
                        {(product.soldCount ?? 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="ks-card-price">
                      <span className="ks-price-now">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.oldPrice && (
                        <>
                          <span className="ks-price-was">
                            <s>${product.oldPrice.toFixed(2)}</s>
                          </span>
                          <span className="ks-save">
                            Save $
                            {(product.oldPrice - product.price).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="ks-card-btns">
                      <motion.button
                        className={`ks-add-btn ${
                          isProductAdded(product.id) ? "added" : ""
                        }`}
                        onClick={() => handleAddToCart(product)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!product.inStock}
                        type="button"
                        aria-label={
                          isProductAdded(product.id)
                            ? `${product.title} added to cart`
                            : `Add ${product.title} to cart`
                        }
                      >
                        {isProductAdded(product.id) ? (
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
                        className="ks-quick-btn"
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
                className="ks-no-results"
                key="no-results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                role="status"
                aria-live="polite"
              >
                <FaSearch className="ks-no-results-icon" aria-hidden="true" />
                <h3>No products found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "Try selecting a different category."}
                </p>
                {searchQuery && (
                  <button
                    className="ks-clear-search-btn"
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
          <div className="ks-load-more">
            <motion.button
              className="ks-load-btn"
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
            className="ks-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseQuickView}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${quickView.title}`}
          >
            <motion.div
              className="ks-modal"
              variants={ANIMATION_VARIANTS.modal}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="ks-modal-close"
                onClick={handleCloseQuickView}
                type="button"
                aria-label="Close quick view modal"
              >
                <FaTimes aria-hidden="true" />
              </button>

              <div className="ks-modal-grid">
                <div className="ks-modal-img">
                  <img
                    src={quickView.image}
                    alt={quickView.title}
                    loading="lazy"
                    width="500"
                    height="500"
                  />
                  {quickView.badge && (
                    <span
                      className="ks-badge"
                      style={{
                        background: quickView.badgeColor,
                      }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                </div>

                <div className="ks-modal-info">
                  <div className="ks-card-author">
                    <span className="ks-brand-dot" aria-hidden="true" />
                    {quickView.author}
                  </div>

                  <h2>{quickView.title}</h2>
                  <span className="ks-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div
                    className="ks-modal-rating-wrapper"
                    style={{ margin: "12px 0" }}
                  >
                    <StarRating
                      currentRating={quickView.rating ?? 0}
                      userRating={userRatings[quickView.id] ?? null}
                      onRate={(rating) =>
                        handleRateProduct(quickView.id, rating)
                      }
                      readonly={false}
                      showLabel={true}
                      size="medium"
                    />
                  </div>

                  <div className="ks-card-price" style={{ margin: "10px 0" }}>
                    <span className="ks-price-now">
                      ${quickView.price.toFixed(2)}
                    </span>
                    {quickView.oldPrice && (
                      <>
                        <span className="ks-price-was">
                          <s>${quickView.oldPrice.toFixed(2)}</s>
                        </span>
                        <span className="ks-save">
                          -{getDiscount(quickView.oldPrice, quickView.price)}%
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    className="ks-modal-tabs"
                    role="tablist"
                    aria-label="Product information tabs"
                  >
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`ks-tab ${modalTab === tab ? "active" : ""}`}
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
                    className="ks-tab-content"
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
                        {quickView.description || "No description available."}
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
                          <strong>Brand:</strong> {quickView.author}
                        </li>
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount ?? 0).toLocaleString()} units
                        </li>
                      </ul>
                    )}
                    {modalTab === "shipping" && (
                      <ul>
                        <li>
                          <FaTruck aria-hidden="true" /> Free shipping over $50
                        </li>
                        <li>
                          <FaUndo aria-hidden="true" /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt aria-hidden="true" /> Comfort guaranteed
                        </li>
                      </ul>
                    )}
                  </div>

                  {Array.isArray(quickView.colors) &&
                    quickView.colors.length > 0 && (
                      <div className="ks-modal-section">
                        <h4 id="color-label">Color</h4>
                        <div
                          className="ks-modal-colors"
                          role="group"
                          aria-labelledby="color-label"
                        >
                          {quickView.colors.map((c, ci) => (
                            <button
                              key={ci}
                              className={`ks-modal-color ${
                                modalColor === c ? "selected" : ""
                              }`}
                              style={{ background: c }}
                              onClick={() => handleColorSelect(c)}
                              type="button"
                              aria-label={`Color ${ci + 1}: ${c}`}
                              aria-pressed={modalColor === c}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {Array.isArray(quickView.sizes) &&
                    quickView.sizes.length > 0 && (
                      <div className="ks-modal-section">
                        <h4 id="size-label">Size</h4>
                        <div
                          className="ks-modal-sizes"
                          role="group"
                          aria-labelledby="size-label"
                        >
                          {quickView.sizes.map((s) => (
                            <button
                              key={s}
                              className={`ks-modal-size ${
                                modalSize === s ? "selected" : ""
                              }`}
                              onClick={() => handleSizeSelect(s)}
                              type="button"
                              aria-label={`Size ${s}`}
                              aria-pressed={modalSize === s}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="ks-modal-section">
                    <h4 id="qty-label">Quantity</h4>
                    <div
                      className="ks-qty"
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

                  <div className="ks-modal-total">
                    Total:{" "}
                    <span aria-live="polite" aria-atomic="true">
                      ${(quickView.price * modalQty).toFixed(2)}
                    </span>
                  </div>

                  <div className="ks-modal-actions">
                    <motion.button
                      className="ks-modal-cart"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleModalAddToCart}
                      disabled={!quickView.inStock}
                      type="button"
                      aria-label={`Add ${quickView.title} to cart`}
                    >
                      <FaShoppingCart aria-hidden="true" /> Add to Cart
                    </motion.button>

                    <motion.button
                      className={`ks-modal-wish ${
                        isInWishlist(quickView.id) ? "liked" : ""
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
                    >
                      <FaHeart aria-hidden="true" />
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

export default KidsShoes;
