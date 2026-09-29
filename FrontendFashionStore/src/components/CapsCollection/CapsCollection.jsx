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
  FaTruck,
  FaUndo,
  FaExpand,
  FaMinus,
  FaPlus,
  FaVenusMars,
  FaMale,
  FaFemale,
  FaChild,
  FaSearch,
  FaShieldAlt,
} from "react-icons/fa";
import useCatalog from "../../hooks/useCatalog";
import "./CapsCollection.css";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x1: parseFloat((Math.random() * 100).toFixed(2)),
  x2: parseFloat((Math.random() * 100).toFixed(2)),
  size: parseFloat((2 + Math.random() * 5).toFixed(2)),
  dur: parseFloat((14 + Math.random() * 16).toFixed(2)),
  delay: parseFloat((Math.random() * 8).toFixed(2)),
  opacity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
}));

const AUDIENCES = [
  { key: "all", label: "All Caps", icon: <FaVenusMars /> },
  { key: "men", label: "Men", icon: <FaMale /> },
  { key: "women", label: "Women", icon: <FaFemale /> },
  { key: "kids", label: "Kids", icon: <FaChild /> },
];

const CATEGORIES = [
  "All",
  "Baseball Caps",
  "Snapbacks",
  "Trucker Hats",
  "Dad Hats",
  "Flat Brims",
  "Fitted Caps",
  "5-Panel",
  "Bucket Hats",
  "Beanies",
  "Visors",
  "Sport Caps",
];

const ANIMATION_VARIANTS = {
  card: {
    hidden: { opacity: 0, y: 60, scale: 0.92 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: i * 0.06,
        ease: "easeOut",
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3 },
    },
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
  section: {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.12,
        ease: "easeOut",
      },
    }),
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
      product.subCategory,
      product.description,
      product.material,
      product.ageRange,
      ...(product.features || []),
    ]
      .filter(Boolean)
      .join(" "),
  );

const getDiscount = (oldPrice, currentPrice) => {
  if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

const getAudienceEmoji = (audience) => {
  switch (audience) {
    case "men":
      return "♂️";
    case "women":
      return "♀️";
    case "kids":
      return "👶";
    default:
      return "";
  }
};

const CapsCollection = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const allCaps = useMemo(
    () =>
      products.filter(
        (product) =>
          product.category === "Accessories" &&
          (product.type === "Caps" ||
            product.type === "Hats" ||
            product.subCategory?.includes("Caps") ||
            product.subCategory?.includes("Hats") ||
            CATEGORIES.includes(product.subCategory)),
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

  const [activeAudience, setActiveAudience] = useState("all");
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
  const [collapsedSections, setCollapsedSections] = useState({});
  const [visibleCount, setVisibleCount] = useState(12);

  const sortRef = useRef(null);
  const wishlistTimerRef = useRef(null);

  const filteredProducts = useMemo(() => {
    let filtered = [...allCaps];

    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

      filtered = filtered.filter((product) => {
        const searchText = getProductSearchText(product);
        return tokens.every((token) => searchText.includes(token));
      });

      if (highlightProductId) {
        const idx = filtered.findIndex(
          (p) => String(p.id) === String(highlightProductId),
        );
        if (idx > 0) {
          const [highlighted] = filtered.splice(idx, 1);
          filtered.unshift(highlighted);
        }
      }
    } else {
      if (activeAudience !== "all") {
        filtered = filtered.filter((p) => p.audience === activeAudience);
      }
      if (activeFilter !== "All") {
        filtered = filtered.filter((p) => p.subCategory === activeFilter);
      }
    }

    const sortFns = {
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      popular: (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
      default: () => 0,
    };

    if (sortFns[sortBy]) {
      filtered = [...filtered].sort(sortFns[sortBy]);
    }

    return filtered;
  }, [
    allCaps,
    searchQuery,
    highlightProductId,
    activeAudience,
    activeFilter,
    sortBy,
  ]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );

  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 12);
  }, []);

  const groupedByCategory = useMemo(() => {
    const groups = {};

    visibleProducts.forEach((product) => {
      const cat = product.subCategory || "Other Caps";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });

    const sortedEntries = Object.entries(groups).sort(
      ([, a], [, b]) => b.length - a.length,
    );

    return Object.fromEntries(sortedEntries);
  }, [visibleProducts]);

  const isGroupedView = useMemo(() => {
    return !searchQuery && activeFilter === "All";
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    if (!searchQuery || !highlightProductId) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(`product-${highlightProductId}`);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("caps-highlight");

      setTimeout(() => {
        el.classList.remove("caps-highlight");
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
      if (event.key === "Escape") setQuickView(null);
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
            category: product.subCategory || "Caps",
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
          size: product.sizes?.[0] ?? "One Size",
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
        size: modalSize || "One Size",
        color: modalColor || "Default",
        quantity: modalQty,
      }),
    );

    setAnimatingCart(quickView.id);
    setTimeout(() => setAnimatingCart(null), 2000);
    setQuickView(null);
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
    setActiveAudience("all");
    setVisibleCount(12);
  }, [setSearchParams]);

  const toggleSection = useCallback((category) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const renderProductCard = useCallback(
    (product, index) => (
      <motion.article
        className="caps-card"
        key={product.id}
        id={`product-${product.id}`}
        variants={ANIMATION_VARIANTS.card}
        initial="hidden"
        whileInView="visible"
        exit="exit"
        viewport={{ once: true, amount: 0.2 }}
        custom={index}
        layout
        aria-label={product.title}
      >
        <div className="caps-card-img">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            width="500"
            height="500"
          />

          {product.badge && (
            <span
              className="caps-badge"
              style={{ background: product.badgeColor }}
              aria-label={`Badge: ${product.badge}`}
            >
              {product.badge}
            </span>
          )}

          {product.audience && (
            <span
              className="caps-audience-tag"
              aria-label={`Audience: ${product.audience}`}
            >
              {getAudienceEmoji(product.audience)}{" "}
              {product.audience.toUpperCase()}
            </span>
          )}

          {product.oldPrice && (
            <span
              className="caps-discount-tag"
              aria-label={`${getDiscount(product.oldPrice, product.price)}% discount`}
            >
              -{getDiscount(product.oldPrice, product.price)}%
            </span>
          )}

          {!product.inStock && (
            <div className="caps-sold-out" aria-label="Out of stock">
              <span>Sold Out</span>
            </div>
          )}

          <motion.button
            className={`caps-heart ${isInWishlist(product.id) ? "liked" : ""}`}
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
        </div>

        <div className="caps-card-body">
          <div className="caps-card-author">
            <span className="caps-brand-dot" aria-hidden="true" />
            {product.author || "Brand"}
          </div>

          <h3 className="caps-card-title">{product.title}</h3>

          <div className="caps-meta-row">
            <span className="caps-card-cat">
              {product.subCategory || "Caps"}
            </span>
            {product.ageRange && (
              <span className="caps-age-tag">{product.ageRange}</span>
            )}
          </div>

          <p className="caps-card-desc">
            {product.description
              ? `${product.description.substring(0, 80)}...`
              : "Premium quality cap"}
          </p>

          <div className="caps-card-rating-wrapper">
            <StarRating
              currentRating={product.rating || 0}
              userRating={userRatings[product.id] ?? null}
              onRate={(rating) => handleRateProduct(product.id, rating)}
              readonly={false}
              showLabel={false}
              size="small"
            />
            <span className="caps-rating-reviews">
              {product.reviews || 0} reviews
            </span>
          </div>

          {product.colors && product.colors.length > 0 && (
            <div
              className="caps-card-colors"
              aria-label={`${product.colors.length} color options`}
            >
              {product.colors.map((c, ci) => (
                <span
                  key={ci}
                  className="caps-color-mini"
                  style={{ background: c }}
                  aria-label={`Color option ${ci + 1}`}
                />
              ))}
              <span className="caps-color-count" aria-hidden="true">
                {product.colors.length} colors
              </span>
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="caps-features-mini">
              {product.features.slice(0, 2).map((f, fi) => (
                <span key={fi} className="caps-feature-tag">
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="caps-sold-info">
            <FaRegClock aria-hidden="true" />
            <span>{(product.soldCount || 0).toLocaleString()} sold</span>
          </div>

          <div className="caps-card-price">
            <span className="caps-price-now">${product.price}</span>
            {product.oldPrice && (
              <>
                <span className="caps-price-was">${product.oldPrice}</span>
                <span className="caps-save-tag">
                  Save $
                  {(
                    (product.oldPrice || product.price) - product.price
                  ).toFixed(2)}
                </span>
              </>
            )}
          </div>

          <div className="caps-card-btns">
            <motion.button
              className={`caps-add-btn ${
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
              {animatingCart === product.id || isInCart(product.id) ? (
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
              className="caps-view-btn"
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
    ),
    [
      isInWishlist,
      handleToggleWishlist,
      userRatings,
      handleRateProduct,
      animatingCart,
      isInCart,
      handleAddToCart,
      handleOpenQuickView,
    ],
  );

  return (
    <div className="caps-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="caps-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            role="status"
            aria-live="polite"
          >
            <FaHeart
              aria-hidden="true"
              className={
                wishlistNotif === "added"
                  ? "caps-toast-heart-added"
                  : "caps-toast-heart-removed"
              }
            />
            {wishlistNotif === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="caps-hero">
        <div className="caps-hero-bg" aria-hidden="true" />
        <div className="caps-hero-overlay" aria-hidden="true" />
        <div className="caps-hero-gradient" aria-hidden="true" />
        <div className="caps-glow g1" aria-hidden="true" />
        <div className="caps-glow g2" aria-hidden="true" />
        <div className="caps-glow g3" aria-hidden="true" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="caps-particle"
            aria-hidden="true"
            initial={{ y: "-10%", x: `${p.x1}%` }}
            animate={{
              y: ["-10%", "110%"],
              x: [`${p.x1}%`, `${p.x2}%`],
            }}
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

        <div className="caps-hero-content">
          <motion.div
            className="caps-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="caps-tag-dot" />
            Caps for Everyone · 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Ultimate
            <br />
            <span className="caps-neon">Caps Collection</span>
          </motion.h1>

          <motion.p
            className="caps-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Premium caps for men, women &amp; kids.
            <br />
            Quality styles. Perfect fit. Every age. Every style.
          </motion.p>

          <motion.div
            className="caps-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="caps-feature">
              <FaMale aria-hidden="true" /> Men
            </div>
            <div className="caps-feature">
              <FaFemale aria-hidden="true" /> Women
            </div>
            <div className="caps-feature">
              <FaChild aria-hidden="true" /> Kids
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {searchQuery && (
          <motion.div
            className="caps-search-info-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            role="status"
            aria-live="polite"
          >
            <div className="caps-search-info-content">
              <FaSearch className="caps-search-info-icon" aria-hidden="true" />
              <span>
                Showing results for: <strong>"{searchQuery}"</strong>
              </span>
              <span className="caps-search-info-count">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <button
              className="caps-search-clear-btn"
              onClick={handleClearSearch}
              type="button"
              aria-label="Clear search results"
            >
              <FaTimes aria-hidden="true" /> Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="caps-audience-bar" aria-label="Audience filters">
        <div className="caps-audience-row">
          {AUDIENCES.map((aud) => (
            <motion.button
              key={aud.key}
              className={[
                "caps-audience-btn",
                activeAudience === aud.key ? "active" : "",
                searchQuery ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                  if (!searchQuery) {
                    setActiveAudience(aud.key);
                    setActiveFilter("All");
                    setVisibleCount(12);
                  }
              }}
              whileHover={{ scale: searchQuery ? 1 : 1.05 }}
              whileTap={{ scale: searchQuery ? 1 : 0.95 }}
              disabled={!!searchQuery}
              type="button"
              aria-pressed={activeAudience === aud.key}
            >
              <span className="caps-audience-icon">{aud.icon}</span>
              {aud.label}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="caps-filter-bar" aria-label="Product filters">
        <div className="caps-filter-row">
          <div className="caps-filter-left">
            <FaFilter className="caps-filter-icon" aria-hidden="true" />

            {searchQuery && (
              <div className="caps-filter-search-mode">
                <FaSearch
                  style={{
                    marginRight: "8px",
                    fontSize: "12px",
                  }}
                  aria-hidden="true"
                />
                <span>
                  Filtering by search: <strong>"{searchQuery}"</strong>
                </span>
              </div>
            )}

            <div
              className="caps-chips"
              role="group"
              aria-label="Category filters"
            >
              {CATEGORIES.map((category) => (
                <motion.button
                  key={category}
                  className={[
                    "caps-chip",
                    activeFilter === category ? "active" : "",
                    searchQuery ? "disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (!searchQuery) setActiveFilter(category); setVisibleCount(12);
                  }}
                  whileHover={{
                    scale: searchQuery ? 1 : 1.05,
                  }}
                  whileTap={{
                    scale: searchQuery ? 1 : 0.95,
                  }}
                  disabled={!!searchQuery}
                  type="button"
                  aria-pressed={activeFilter === category}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="caps-filter-right">
            <div className="caps-sort-wrap" ref={sortRef}>
              <button
                className="caps-sort-btn"
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
                    className="caps-sort-drop"
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
                          "caps-sort-item",
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

            <span className="caps-count" aria-live="polite">
              <span>{filteredProducts.length}</span> caps found
            </span>
          </div>
        </div>
      </section>

      <section className="caps-grid-section" aria-label="Products grid">
        <motion.div className="caps-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              isGroupedView ? (
                <>
                  {Object.entries(groupedByCategory).map(
                    ([category, items], sectionIndex) => {
                      const isCollapsed = collapsedSections[category];
                      const sectionId = `category-section-${normalizeText(
                        category,
                      ).replace(/\s+/g, "-")}`;

                      return (
                        <motion.section
                          key={category}
                          id={sectionId}
                          className="caps-category-section"
                          variants={ANIMATION_VARIANTS.section}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{
                            once: true,
                            amount: 0.1,
                          }}
                          custom={sectionIndex}
                          aria-label={`${category} — ${items.length} products`}
                        >
                          <div className="caps-section-header">
                            <div className="caps-section-title-row">
                              <h2 className="caps-section-title">{category}</h2>
                              <span className="caps-section-count">
                                {items.length} cap
                                {items.length !== 1 ? "s" : ""}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="caps-section-toggle"
                              onClick={() => toggleSection(category)}
                              aria-expanded={!isCollapsed}
                              aria-label={
                                isCollapsed
                                  ? `Expand ${category}`
                                  : `Collapse ${category}`
                              }
                            >
                              <motion.span
                                animate={{
                                  rotate: isCollapsed ? -90 : 0,
                                }}
                                transition={{
                                  duration: 0.25,
                                }}
                              >
                                <FaChevronDown />
                              </motion.span>
                              {isCollapsed ? "Show" : "Hide"}
                            </button>
                          </div>

                          <div className="caps-section-divider">
                            <div className="caps-section-line" />
                          </div>

                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.div
                                className="caps-section-grid"
                                initial={{
                                  opacity: 0,
                                  height: 0,
                                }}
                                animate={{
                                  opacity: 1,
                                  height: "auto",
                                }}
                                exit={{
                                  opacity: 0,
                                  height: 0,
                                }}
                                transition={{
                                  duration: 0.35,
                                  ease: "easeInOut",
                                }}
                              >
                                {items.map((product, idx) =>
                                  renderProductCard(product, idx),
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.section>
                      );
                    },
                  )}
                </>
              ) : (
                visibleProducts.map((product, index) =>
                  renderProductCard(product, index),
                )
              )
            ) : (
              <motion.div
                className="caps-no-results"
                key="no-results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                role="status"
                aria-live="polite"
              >
                <FaSearch className="caps-no-results-icon" aria-hidden="true" />
                <h3>No caps found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "Try selecting a different category or audience."}
                </p>
                {searchQuery && (
                  <button
                    className="caps-clear-search-btn"
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
          <div className="caps-load-more">
            <motion.button
              className="caps-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Load more products"
              onClick={handleLoadMore}
            >
              Load More Caps <FaArrowRight aria-hidden="true" />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="caps-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseQuickView}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${quickView.title}`}
          >
            <motion.div
              className="caps-modal"
              variants={ANIMATION_VARIANTS.modal}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="caps-modal-close"
                onClick={handleCloseQuickView}
                type="button"
                aria-label="Close quick view modal"
              >
                <FaTimes />
              </button>

              <div className="caps-modal-grid">
                <div className="caps-modal-img">
                  <img
                    src={quickView.image}
                    alt={quickView.title}
                    loading="lazy"
                  />
                  {quickView.badge && (
                    <span
                      className="caps-badge"
                      style={{
                        background: quickView.badgeColor,
                      }}
                      aria-label={`Badge: ${quickView.badge}`}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  {quickView.audience && (
                    <div className="caps-img-tags caps-tags-modal">
                      <span className="caps-modal-audience-tag">
                        {getAudienceEmoji(quickView.audience)}{" "}
                        {quickView.audience.toUpperCase()}
                      </span>
                      {quickView.ageRange && (
                        <span className="caps-age-tag-modal">
                          {quickView.ageRange}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="caps-modal-info">
                  <div className="caps-card-author">
                    <span className="caps-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>

                  <div className="caps-meta-row">
                    <span className="caps-card-cat">
                      {quickView.subCategory || "Caps"}
                    </span>
                    {quickView.ageRange && (
                      <span className="caps-age-tag">{quickView.ageRange}</span>
                    )}
                  </div>

                  <div
                    className="caps-modal-rating-wrapper"
                    style={{ margin: "12px 0" }}
                  >
                    <StarRating
                      currentRating={quickView.rating || 0}
                      userRating={userRatings[quickView.id] || null}
                      onRate={(rating) =>
                        handleRateProduct(quickView.id, rating)
                      }
                      readonly={false}
                      showLabel={true}
                      size="medium"
                    />
                  </div>

                  <div className="caps-card-price" style={{ margin: "10px 0" }}>
                    <span className="caps-price-now">${quickView.price}</span>
                    {quickView.oldPrice && (
                      <>
                        <span className="caps-price-was">
                          ${quickView.oldPrice || quickView.price}
                        </span>
                        <span className="caps-save-tag">
                          -
                          {getDiscount(
                            quickView.oldPrice || quickView.price,
                            quickView.price,
                          )}
                          %
                        </span>
                      </>
                    )}
                  </div>

                  <div className="caps-modal-tabs">
                    {["description", "details", "features", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`caps-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="caps-tab-content">
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
                          "Premium quality cap for everyday wear."}
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
                          {quickView.subCategory || "Caps"}
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
                    {modalTab === "features" && (
                      <ul>
                        {quickView.features?.map((f, fi) => (
                          <li key={fi}>
                            <FaCheck style={{ color: "#00ff88" }} /> {f}
                          </li>
                        ))}
                        <li>
                          <FaTruck /> Free shipping on orders over $50
                        </li>
                        <li>
                          <FaUndo /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt /> Quality guaranteed
                        </li>
                      </ul>
                    )}
                  </div>

                  {quickView.colors && quickView.colors.length > 0 && (
                    <div className="caps-modal-section">
                      <h4>Color</h4>
                      <div className="caps-modal-colors">
                        {quickView.colors.map((c, ci) => (
                          <div
                            key={ci}
                            className={`caps-modal-color ${
                              modalColor === c ? "selected" : ""
                            }`}
                            style={{ background: c }}
                            onClick={() => setModalColor(c)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {quickView.sizes && quickView.sizes.length > 0 && (
                    <div className="caps-modal-section">
                      <h4>Size</h4>
                      <div className="caps-modal-sizes">
                        {quickView.sizes.map((s) => (
                          <button
                            key={s}
                            className={`caps-modal-size ${
                              modalSize === s ? "selected" : ""
                            }`}
                            onClick={() => setModalSize(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="caps-modal-section">
                    <h4>Quantity</h4>
                    <div className="caps-qty">
                      <button
                        onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      >
                        <FaMinus />
                      </button>
                      <span>{modalQty}</span>
                      <button onClick={() => setModalQty(modalQty + 1)}>
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  <div className="caps-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="caps-modal-actions">
                    <motion.button
                      className="caps-modal-cart"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleModalAddToCart}
                    >
                      <FaShoppingCart /> Add to Cart
                    </motion.button>

                    <motion.button
                      className={`caps-modal-wish ${
                        isInWishlist(quickView.id) ? "wished" : ""
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleWishlist(quickView)}
                      title={
                        isInWishlist(quickView.id)
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                      }
                    >
                      <FaHeart
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

export default CapsCollection;
