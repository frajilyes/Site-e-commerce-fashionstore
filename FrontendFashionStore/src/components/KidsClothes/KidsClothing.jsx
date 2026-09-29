import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../pages/Checkout/cartSlice";
import { addToWishlist, removeFromWishlist } from "../../components/WishList/wishlistSlice";
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
  FaChild,
  FaSearch,
} from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";
import useCatalog from "../../hooks/useCatalog";
import "./KidsClothing.css";

const PARTICLES = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  x1: Math.random() * 100,
  x2: Math.random() * 100,
  size: 2 + Math.random() * 6,
  dur: 12 + Math.random() * 16,
  delay: Math.random() * 8,
  opacity: 0.25 + Math.random() * 0.45,
}));

const SHAPES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  emoji: [
    "⭐",
    "🌟",
    "💫",
    "✨",
    "🦋",
    "🌈",
    "🎈",
    "🎀",
    "🧸",
    "🎯",
    "🎪",
    "🎨",
  ][i],
  x: Math.random() * 90 + 5,
  dur: 15 + Math.random() * 20,
  delay: Math.random() * 10,
  size: 16 + Math.random() * 14,
}));

const CATEGORIES = [
  "All",
  "T-Shirts",
  "Dresses",
  "Pants",
  "Shorts",
  "Jackets",
  "Shoes",
  "Pajamas",
  "School Wear",
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
      product.author,
      product.category,
      product.subCategory,
      product.description,
      product.material,
      product.ageRange,
      ...(product.features || []),
    ]
      .filter(Boolean)
      .join(" "),
  );
};

const getDiscount = (oldPrice, currentPrice) => {
  if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

const KidsClothing = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const allKidsProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.audience === "kids" ||
          (product.ageRange &&
            (product.ageRange.includes("2-") ||
              product.ageRange.includes("3-") ||
              product.ageRange.includes("4-") ||
              product.ageRange.includes("5-") ||
              product.ageRange.includes("6-") ||
              product.ageRange.includes("7-") ||
              product.ageRange.includes("8-") ||
              product.ageRange.includes("9-") ||
              product.ageRange.includes("10-") ||
              product.ageRange.includes("11-") ||
              product.ageRange.includes("12-") ||
              product.ageRange.includes("kids") ||
              product.ageRange.includes("children"))) ||
          CATEGORIES.includes(product.subCategory),
      ),
    [products],
  );

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

  const filteredProducts = useMemo(() => {
    let filtered = [...allKidsProducts];

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
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      popular: (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
      default: () => 0,
    };

    if (sortFunctions[sortBy]) {
      filtered = [...filtered].sort(sortFunctions[sortBy]);
    }

    return filtered;
  }, [allKidsProducts, searchQuery, highlightProductId, activeFilter, sortBy]);

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
      element.classList.add("kc-highlight");

      const removeTimer = setTimeout(() => {
        element.classList.remove("kc-highlight");
      }, 3000);

      return () => clearTimeout(removeTimer);
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

  const handleRateProduct = useCallback(
    (productId, rating) => {
      dispatch(setRating({ productId, rating }));
    },
    [dispatch],
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
            category: product.subCategory || "Kids",
            rating: product.rating,
            reviews: product.reviews,
            audience: product.audience || "kids",
          }),
        );
        showWishlistNotif("added");
      }
    },
    [dispatch, showWishlistNotif, wishlistItems],
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
    <div className="kc-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="kc-wishlist-toast"
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
                  ? "kc-toast-heart-added"
                  : "kc-toast-heart-removed"
              }
            />
            {wishlistNotif === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="kc-hero">
        <div className="kc-hero-bg" aria-hidden="true" />
        <div className="kc-hero-overlay" aria-hidden="true" />
        <div className="kc-hero-gradient" aria-hidden="true" />
        <div className="kc-glow kg1" aria-hidden="true" />
        <div className="kc-glow kg2" aria-hidden="true" />
        <div className="kc-glow kg3" aria-hidden="true" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="kc-particle"
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

        {SHAPES.map((s) => (
          <motion.div
            key={`shape-${s.id}`}
            className="kc-float-shape"
            aria-hidden="true"
            initial={{ y: "110%", x: `${s.x}%`, rotate: 0 }}
            animate={{
              y: ["110%", "-10%"],
              rotate: [0, 360],
            }}
            transition={{
              duration: s.dur,
              repeat: Infinity,
              ease: "linear",
              delay: s.delay,
            }}
            style={{
              left: 0,
              fontSize: `${s.size}px`,
            }}
          >
            {s.emoji}
          </motion.div>
        ))}

        <div className="kc-hero-content">
          <motion.div
            className="kc-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <GiPartyPopper className="kc-tag-icon" />
            Kids' Collection 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Little Ones,
            <br />
            <span className="kc-neon">Big Style</span>
          </motion.h1>

          <motion.p
            className="kc-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Adorable, durable, and fun clothing for your little adventurers.
            <br />
            Safe materials. Happy kids. Happy parents.
          </motion.p>

          <motion.div
            className="kc-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="kc-feat">
              <FaTruck aria-hidden="true" /> Free Shipping
            </div>
            <div className="kc-feat">
              <FaShieldAlt aria-hidden="true" /> Child-Safe Materials
            </div>
            <div className="kc-feat">
              <FaUndo aria-hidden="true" /> Easy Returns
            </div>
            <div className="kc-feat">
              <FaChild aria-hidden="true" /> Ages 2-12
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {searchQuery && (
          <motion.div
            className="kc-search-info-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            role="status"
            aria-live="polite"
          >
            <div className="kc-search-info-content">
              <FaSearch className="kc-search-info-icon" aria-hidden="true" />
              <span>
                Showing results for: <strong>"{searchQuery}"</strong>
              </span>
              <span className="kc-search-info-count">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <button
              className="kc-search-clear-btn"
              onClick={handleClearSearch}
              type="button"
              aria-label="Clear search results"
            >
              <FaTimes aria-hidden="true" /> Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="kc-filter-bar" aria-label="Product filters">
        <div className="kc-filter-row">
          <div className="kc-filter-left">
            <FaFilter className="kc-filter-icon" aria-hidden="true" />

            {searchQuery && (
              <div className="kc-filter-search-mode">
                <FaSearch style={{ marginRight: "8px", fontSize: "12px" }} />
                <span>
                  Filtering by search: <strong>"{searchQuery}"</strong>
                </span>
              </div>
            )}

            <div
              className="kc-chips"
              role="group"
              aria-label="Category filters"
            >
              {CATEGORIES.map((category) => (
                <motion.button
                  key={category}
                  className={[
                    "kc-chip",
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
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="kc-filter-right">
            <div className="kc-sort-wrap" ref={sortRef}>
              <button
                className="kc-sort-btn"
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
                    className="kc-sort-drop"
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
                          "kc-sort-item",
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

            <span className="kc-count" aria-live="polite">
              <span>{filteredProducts.length}</span> products found
            </span>
          </div>
        </div>
      </section>

      <section className="kc-grid-section" aria-label="Products grid">
        <motion.div className="kc-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              visibleProducts.map((product, index) => (
                <motion.article
                  className="kc-card"
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
                  <div className="kc-card-img">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      width="500"
                      height="500"
                    />

                    {product.badge && (
                      <span
                        className="kc-badge"
                        style={{ background: product.badgeColor }}
                        aria-label={`Badge: ${product.badge}`}
                      >
                        {product.badge}
                      </span>
                    )}

                    {product.oldPrice && (
                      <span
                        className="kc-discount-tag"
                        aria-label={`${getDiscount(
                          product.oldPrice,
                          product.price,
                        )}% discount`}
                      >
                        -{getDiscount(product.oldPrice, product.price)}%
                      </span>
                    )}

                    {product.ageRange && (
                      <span
                        className="kc-age-tag"
                        aria-label={`Age range: ${product.ageRange}`}
                      >
                        <FaChild aria-hidden="true" /> {product.ageRange}
                      </span>
                    )}

                    {!product.inStock && (
                      <div className="kc-sold-out" aria-label="Out of stock">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`kc-heart ${
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

                  <div className="kc-card-body">
                    <div className="kc-card-author">
                      <span className="kc-brand-dot" aria-hidden="true" />
                      {product.author || "Brand"}
                    </div>

                    <h3 className="kc-card-title">{product.title}</h3>
                    <span className="kc-card-cat">
                      {product.subCategory || product.category}
                    </span>

                    <p className="kc-card-desc">
                      {product.description
                        ? `${product.description.substring(0, 85)}...`
                        : "Premium quality product for kids"}
                    </p>

                    <div className="kc-card-rating-wrapper">
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
                      <span className="kc-rating-reviews">
                        {product.reviews || 0} reviews
                      </span>
                    </div>

                    {product.colors && product.colors.length > 0 && (
                      <div
                        className="kc-card-colors"
                        aria-label={`${product.colors.length} color options available`}
                      >
                        {product.colors.map((c, ci) => (
                          <span
                            key={ci}
                            className="kc-color-dot"
                            style={{ background: c }}
                            aria-label={`Color option ${ci + 1}`}
                            title={`Color option ${ci + 1}`}
                          />
                        ))}
                        <span className="kc-color-label" aria-hidden="true">
                          {product.colors.length} colors
                        </span>
                      </div>
                    )}

                    <div className="kc-sold-info">
                      <FaRegClock aria-hidden="true" />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="kc-card-price">
                      <span className="kc-price-now">${product.price}</span>
                      {product.oldPrice && (
                        <>
                          <span className="kc-price-was">
                            ${product.oldPrice}
                          </span>
                          <span className="kc-save">
                            Save $
                            {(
                              (product.oldPrice || product.price) -
                              product.price
                            ).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="kc-card-btns">
                      <motion.button
                        className={`kc-add-btn ${
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
                        className="kc-quick-btn"
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
                className="kc-no-results"
                key="no-results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                role="status"
                aria-live="polite"
                style={{ textAlign: "center", padding: "40px" }}
              >
                <FaSearch
                  className="kc-no-results-icon"
                  aria-hidden="true"
                  style={{ fontSize: "48px", color: "#666" }}
                />
                <h3>No products found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "Try selecting a different category."}
                </p>
                {searchQuery && (
                  <button
                    className="kc-clear-search-btn"
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
          <div className="kc-load-more">
            <motion.button
              className="kc-load-btn"
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
            className="kc-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseQuickView}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${quickView.title}`}
          >
            <motion.div
              className="kc-modal"
              variants={ANIMATION_VARIANTS.modal}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="kc-modal-close"
                onClick={handleCloseQuickView}
                type="button"
                aria-label="Close quick view modal"
              >
                <FaTimes aria-hidden="true" />
              </button>

              <div className="kc-modal-grid">
                <div className="kc-modal-img">
                  <img
                    src={quickView.image}
                    alt={quickView.title}
                    loading="lazy"
                    width="500"
                    height="500"
                  />
                  {quickView.badge && (
                    <span
                      className="kc-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  {quickView.ageRange && (
                    <span className="kc-age-tag kc-age-modal">
                      <FaChild aria-hidden="true" /> {quickView.ageRange}
                    </span>
                  )}
                </div>

                <div className="kc-modal-info">
                  <div className="kc-card-author">
                    <span className="kc-brand-dot" aria-hidden="true" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>
                  <span className="kc-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div
                    className="kc-modal-rating-wrapper"
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

                  <div className="kc-card-price" style={{ margin: "10px 0" }}>
                    <span className="kc-price-now">${quickView.price}</span>
                    {quickView.oldPrice && (
                      <>
                        <span className="kc-price-was">
                          ${quickView.oldPrice}
                        </span>
                        <span className="kc-save">
                          -{getDiscount(quickView.oldPrice, quickView.price)}%
                        </span>
                      </>
                    )}
                  </div>

                  <div className="kc-modal-tabs" role="tablist">
                    {["description", "details", "safety", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`kc-tab ${modalTab === tab ? "active" : ""}`}
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
                    className="kc-tab-content"
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
                          "Premium quality product for kids."}
                      </p>
                    )}
                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "Cotton blend"}
                        </li>
                        <li>
                          <strong>Category:</strong>{" "}
                          {quickView.subCategory || quickView.category}
                        </li>
                        <li>
                          <strong>Brand:</strong> {quickView.author || "Brand"}
                        </li>
                        {quickView.ageRange && (
                          <li>
                            <strong>Age Range:</strong> {quickView.ageRange}
                          </li>
                        )}
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount || 0).toLocaleString()} units
                        </li>
                      </ul>
                    )}
                    {modalTab === "safety" && (
                      <ul>
                        <li>
                          <FaShieldAlt aria-hidden="true" /> CPSC certified
                          child-safe materials
                        </li>
                        <li>
                          <FaTruck aria-hidden="true" /> Free shipping on orders
                          over $30
                        </li>
                        <li>
                          <FaUndo aria-hidden="true" /> 60-day hassle-free
                          returns
                        </li>
                        <li>
                          <FaCheck aria-hidden="true" /> Hypoallergenic &
                          non-toxic dyes
                        </li>
                      </ul>
                    )}
                  </div>

                  {quickView.colors && quickView.colors.length > 0 && (
                    <div className="kc-modal-section">
                      <h4 id="color-label">Color</h4>
                      <div
                        className="kc-modal-colors"
                        role="group"
                        aria-labelledby="color-label"
                      >
                        {quickView.colors.map((c, ci) => (
                          <button
                            key={ci}
                            className={`kc-modal-color ${
                              modalColor === c ? "selected" : ""
                            }`}
                            style={{ background: c }}
                            onClick={() => handleColorSelect(c)}
                            type="button"
                            aria-label={`Color option ${ci + 1}`}
                            aria-pressed={modalColor === c}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {quickView.sizes && quickView.sizes.length > 0 && (
                    <div className="kc-modal-section">
                      <h4 id="size-label">Size</h4>
                      <div
                        className="kc-modal-sizes"
                        role="group"
                        aria-labelledby="size-label"
                      >
                        {quickView.sizes.map((s) => (
                          <button
                            key={s}
                            className={`kc-modal-size ${
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

                  <div className="kc-modal-section">
                    <h4 id="qty-label">Quantity</h4>
                    <div
                      className="kc-qty"
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

                  <div className="kc-modal-total">
                    Total:{" "}
                    <span aria-live="polite" aria-atomic="true">
                      ${(quickView.price * modalQty).toFixed(2)}
                    </span>
                  </div>

                  <div className="kc-modal-actions">
                    <motion.button
                      className="kc-modal-cart"
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
                      className={`kc-modal-wish ${
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

export default KidsClothing;
