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
import useCatalog from "../../hooks/useCatalog";
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
  FaMale,
  FaRulerVertical,
  FaSearch,
} from "react-icons/fa";
import { GiArmoredPants } from "react-icons/gi";
import "./MenPants.css";

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x1: parseFloat((Math.random() * 100).toFixed(2)),
  x2: parseFloat((Math.random() * 100).toFixed(2)),
  size: parseFloat((2 + Math.random() * 5).toFixed(2)),
  dur: parseFloat((14 + Math.random() * 16).toFixed(2)),
  delay: parseFloat((Math.random() * 8).toFixed(2)),
  opacity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
}));

const SUB_CATEGORIES = [
  "All",
  "Chinos",
  "Jeans",
  "Joggers",
  "Dress Pants",
  "Cargo",
  "Linen",
  "Corduroy",
];

const WAIST_SIZES = ["28", "30", "32", "34", "36", "38", "40"];

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
      product.subCategory,
      product.description,
      product.material,
      product.fit,
    ]
      .filter(Boolean)
      .join(" "),
  );

const getDiscount = (oldPrice, currentPrice) => {
  if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

const MenPants = () => {
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
  const [selectedWaist, setSelectedWaist] = useState(null);
  const [wishlistNotif, setWishlistNotif] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);


  const sortRef = useRef(null);
  const wishlistTimerRef = useRef(null);


  const allPants = useMemo(
    () =>
      products.filter(
        (p) =>
          p.audience === "men" &&
          (p.category === "Pants" ||
            p.category === "Men Pants" ||
            p.category === "Men's Pants"),
      ),
    [products],
  );


  const filteredPants = useMemo(() => {
    let result = [...allPants];

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
        result = result.filter((p) => p.subCategory === activeFilter);
      }
    }

    if (selectedWaist) {
      result = result.filter(
        (p) => Array.isArray(p.sizes) && p.sizes.includes(selectedWaist),
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
      result = [...result].sort(sortFunctions[sortBy]);
    }

    return result;
  }, [
    allPants,
    searchQuery,
    highlightProductId,
    activeFilter,
    selectedWaist,
    sortBy,
  ]);

  const visibleProducts = filteredPants.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPants.length;
  const handleLoadMore = () => setVisibleCount((prev) => prev + 12);


  useEffect(() => {
    if (!searchQuery || !highlightProductId) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`pants-${highlightProductId}`);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("mp-highlight");

      setTimeout(() => {
        element.classList.remove("mp-highlight");
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
            category: product.subCategory || product.category,
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
      alert("Please select a waist size");
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
    setVisibleCount(12);
  }, [setSearchParams]);

  const clearAllFilters = useCallback(() => {
    setActiveFilter("All");
    setSelectedWaist(null);
    setVisibleCount(12);
  }, []);

  return (
    <div className="mp-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="mp-wishlist-toast"
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
                  ? "mp-toast-heart-added"
                  : "mp-toast-heart-removed"
              }
            />
            {wishlistNotif === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mp-hero">
        <div className="mp-hero-bg" aria-hidden="true" />
        <div className="mp-hero-overlay" aria-hidden="true" />
        <div className="mp-hero-gradient" aria-hidden="true" />
        <div className="mp-glow mg1" aria-hidden="true" />
        <div className="mp-glow mg2" aria-hidden="true" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="mp-particle"
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

        <div className="mp-hero-content">
          <motion.div
            className="mp-breadcrumb"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span>Home</span> / <span>Shop</span> / <span>Men</span> /{" "}
            <span className="mp-bread-active">Pants</span>
          </motion.div>

          <motion.div
            className="mp-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <GiArmoredPants className="mp-tag-icon" aria-hidden="true" />
            <FaMale className="mp-tag-icon" aria-hidden="true" />
            Men's Pants Collection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Find Your Perfect
            <br />
            <span className="mp-neon">Fit</span>
          </motion.h1>

          <motion.p
            className="mp-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            From classic chinos to premium selvedge denim — discover pants
            <br />
            crafted for comfort, style, and every occasion.
          </motion.p>

          <motion.div
            className="mp-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="mp-feat">
              <FaTruck aria-hidden="true" /> Free Shipping
            </div>
            <div className="mp-feat">
              <FaShieldAlt aria-hidden="true" /> Premium Quality
            </div>
            <div className="mp-feat">
              <FaUndo aria-hidden="true" /> 30-Day Returns
            </div>
            <div className="mp-feat">
              <FaRulerVertical aria-hidden="true" /> Size Guide
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {searchQuery && (
          <motion.div
            className="mp-search-info-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            role="status"
            aria-live="polite"
          >
            <div className="mp-search-info-content">
              <FaSearch className="mp-search-info-icon" aria-hidden="true" />
              <span>
                Showing results for: <strong>"{searchQuery}"</strong>
              </span>
              <span className="mp-search-info-count">
                {filteredPants.length} pant
                {filteredPants.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <button
              className="mp-search-clear-btn"
              onClick={handleClearSearch}
              type="button"
              aria-label="Clear search results"
            >
              <FaTimes aria-hidden="true" /> Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mp-filter-bar" aria-label="Product filters">
        <div className="mp-filter-row">
          <div className="mp-filter-left">
            <FaFilter className="mp-filter-icon" aria-hidden="true" />

            {searchQuery && (
              <div className="mp-filter-search-mode">
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
              className="mp-chips"
              role="group"
              aria-label="Category filters"
            >
              {SUB_CATEGORIES.map((cat) => (
                <motion.button
                  key={cat}
                  className={[
                    "mp-chip",
                    activeFilter === cat ? "active" : "",
                    searchQuery ? "disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (!searchQuery) setActiveFilter(cat); setVisibleCount(12);
                  }}
                  whileHover={{ scale: searchQuery ? 1 : 1.05 }}
                  whileTap={{ scale: searchQuery ? 1 : 0.95 }}
                  disabled={!!searchQuery}
                  type="button"
                  aria-pressed={activeFilter === cat}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mp-filter-right">
            <div
              className="mp-waist-filter"
              role="group"
              aria-label="Waist size filter"
            >
              <span className="mp-waist-label">Waist:</span>
              <div className="mp-waist-chips">
                {WAIST_SIZES.map((w) => (
                  <button
                    key={w}
                    className={`mp-waist-btn ${
                      selectedWaist === w ? "active" : ""
                    }`}
                    onClick={() =>
                      setSelectedWaist(selectedWaist === w ? null : w)
                    }
                    type="button"
                    aria-pressed={selectedWaist === w}
                    aria-label={`Waist size ${w}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="mp-sort-wrap" ref={sortRef}>
              <button
                className="mp-sort-btn"
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
                    className="mp-sort-drop"
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
                          "mp-sort-item",
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
          </div>
        </div>

        <div className="mp-results-info" aria-live="polite">
          <span className="mp-count">
            <span>{filteredPants.length}</span> pants found
          </span>

          {!searchQuery && activeFilter !== "All" && (
            <span className="mp-active-tag">
              {activeFilter}
              <FaTimes
                className="mp-clear"
                onClick={() => { setActiveFilter("All"); setVisibleCount(12); }}
                aria-label={`Remove ${activeFilter} filter`}
                role="button"
                tabIndex={0}
              />
            </span>
          )}

          {selectedWaist && (
            <span className="mp-active-tag">
              Waist: {selectedWaist}
              <FaTimes
                className="mp-clear"
                onClick={() => setSelectedWaist(null)}
                aria-label="Remove waist filter"
                role="button"
                tabIndex={0}
              />
            </span>
          )}

          {searchQuery && (
            <button
              className="mp-clear-search-inline"
              onClick={handleClearSearch}
              type="button"
            >
              <FaTimes aria-hidden="true" /> Clear Search
            </button>
          )}
        </div>
      </section>

      <section className="mp-grid-section" aria-label="Products grid">
        <motion.div className="mp-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredPants.length > 0 ? (
              visibleProducts.map((product, index) => (
                <motion.article
                  className="mp-card"
                  key={product.id}
                  id={`pants-${product.id}`}
                  variants={ANIMATION_VARIANTS.card}
                  initial="hidden"
                  whileInView="visible"
                  exit="exit"
                  viewport={{ once: true }}
                  custom={index}
                  layout
                  aria-label={product.title}
                >
                  <div className="mp-card-img">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      width="500"
                      height="500"
                    />

                    {product.badge && (
                      <span
                        className="mp-badge"
                        style={{ background: product.badgeColor }}
                        aria-label={`Badge: ${product.badge}`}
                      >
                        {product.badge}
                      </span>
                    )}

                    {product.oldPrice && (
                      <span
                        className="mp-discount-tag"
                        aria-label={`${getDiscount(
                          product.oldPrice,
                          product.price,
                        )}% discount`}
                      >
                        -{getDiscount(product.oldPrice, product.price)}%
                      </span>
                    )}

                    {product.fit && (
                      <span
                        className="mp-fit-tag"
                        aria-label={`Fit: ${product.fit}`}
                      >
                        <FaRulerVertical aria-hidden="true" /> {product.fit}
                      </span>
                    )}

                    {!product.inStock && (
                      <div className="mp-sold-out" aria-label="Out of stock">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`mp-heart ${
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

                    <motion.button
                      className="mp-quick-view-img-btn"
                      onClick={() => handleOpenQuickView(product)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      aria-label={`Quick view ${product.title}`}
                    >
                      <FaExpand aria-hidden="true" />
                    </motion.button>
                  </div>

                  <div className="mp-card-body">
                    <div className="mp-card-author">
                      <span className="mp-brand-dot" aria-hidden="true" />
                      {product.author || "Brand"}
                    </div>

                    <h3 className="mp-card-title">{product.title}</h3>

                    <div className="mp-card-tags">
                      <span className="mp-card-cat">
                        {product.subCategory || product.category}
                      </span>
                      {product.fit && (
                        <span className="mp-card-fit">{product.fit}</span>
                      )}
                    </div>

                    <p className="mp-card-desc">
                      {product.description
                        ? `${product.description.substring(0, 85)}...`
                        : "Premium quality pants"}
                    </p>

                    <div className="mp-card-rating-wrapper">
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
                      <span className="mp-rating-reviews">
                        {product.reviews || 0} reviews
                      </span>
                    </div>

                    {product.colors && product.colors.length > 0 && (
                      <div
                        className="mp-card-colors"
                        aria-label={`${product.colors.length} color options`}
                      >
                        {product.colors.map((c, ci) => (
                          <span
                            key={ci}
                            className="mp-color-dot"
                            style={{ background: c }}
                            aria-label={`Color option ${ci + 1}`}
                            title={`Color option ${ci + 1}`}
                          />
                        ))}
                        <span className="mp-color-label" aria-hidden="true">
                          {product.colors.length} colors
                        </span>
                      </div>
                    )}

                    {product.sizes && product.sizes.length > 0 && (
                      <div
                        className="mp-card-sizes"
                        aria-label="Available waist sizes"
                      >
                        {product.sizes.map((s) => (
                          <span key={s} className="mp-size-mini">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mp-sold-info">
                      <FaRegClock aria-hidden="true" />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="mp-card-price">
                      <span className="mp-price-now">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.oldPrice && (
                        <>
                          <span className="mp-price-was">
                            ${product.oldPrice.toFixed(2)}
                          </span>
                          <span className="mp-save">
                            Save $
                            {(product.oldPrice - product.price).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mp-card-btns">
                      <motion.button
                        className={`mp-add-btn ${
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
                        className="mp-quick-btn"
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
                className="mp-no-results"
                key="no-results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                role="status"
                aria-live="polite"
              >
                <GiArmoredPants className="mp-no-icon" aria-hidden="true" />
                <h3>No pants found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "Try adjusting your filters."}
                </p>
                {searchQuery ? (
                  <button
                    className="mp-clear-search-btn"
                    onClick={handleClearSearch}
                    type="button"
                    aria-label="Clear search"
                  >
                    <FaTimes aria-hidden="true" /> Clear Search
                  </button>
                ) : (
                  <button
                    className="mp-clear-search-btn"
                    onClick={clearAllFilters}
                    type="button"
                    aria-label="Clear all filters"
                  >
                    Clear All Filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {hasMore && (
          <div className="mp-load-more">
            <motion.button
              className="mp-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Load more pants"
              onClick={handleLoadMore}
            >
              Load More Pants <FaArrowRight aria-hidden="true" />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="mp-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseQuickView}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${quickView.title}`}
          >
            <motion.div
              className="mp-modal"
              variants={ANIMATION_VARIANTS.modal}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="mp-modal-close"
                onClick={handleCloseQuickView}
                type="button"
                aria-label="Close quick view modal"
              >
                <FaTimes />
              </button>

              <div className="mp-modal-grid">
                <div className="mp-modal-img">
                  <img
                    src={quickView.image}
                    alt={quickView.title}
                    loading="lazy"
                  />
                  {quickView.badge && (
                    <span
                      className="mp-badge"
                      style={{ background: quickView.badgeColor }}
                      aria-label={`Badge: ${quickView.badge}`}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  <div className="mp-img-tags mp-tags-modal">
                    {quickView.fit && (
                      <span className="mp-fit-tag">{quickView.fit}</span>
                    )}
                    {quickView.length && (
                      <span className="mp-length-tag">{quickView.length}</span>
                    )}
                  </div>
                </div>

                <div className="mp-modal-info">
                  <div className="mp-card-author">
                    <span className="mp-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>

                  <div className="mp-card-tags">
                    <span className="mp-card-cat">
                      {quickView.subCategory || quickView.category}
                    </span>
                    {quickView.fit && (
                      <span className="mp-card-fit">{quickView.fit}</span>
                    )}
                    {quickView.length && (
                      <span className="mp-card-fit">{quickView.length}</span>
                    )}
                  </div>

                  <div
                    className="mp-modal-rating-wrapper"
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

                  <div className="mp-card-price" style={{ margin: "10px 0" }}>
                    <span className="mp-price-now">${quickView.price}</span>
                    {quickView.oldPrice && (
                      <>
                        <span className="mp-price-was">
                          ${quickView.oldPrice || quickView.price}
                        </span>
                        <span className="mp-save">
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

                  <div className="mp-modal-tabs">
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`mp-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="mp-tab-content">
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
                          "Premium quality pants for any occasion."}
                      </p>
                    )}
                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "Cotton"}
                        </li>
                        <li>
                          <strong>Fit:</strong> {quickView.fit || "Regular"}
                        </li>
                        <li>
                          <strong>Length:</strong>{" "}
                          {quickView.length || "Regular"}
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
                          <FaTruck /> Free shipping over $50
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

                  <div className="mp-modal-section">
                    <h4>Color</h4>
                    <div className="mp-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`mp-modal-color ${
                            modalColor === c ? "selected" : ""
                          }`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mp-modal-section">
                    <h4>Waist Size</h4>
                    <div className="mp-modal-sizes">
                      {(quickView.sizes || []).map((s) => (
                        <button
                          key={s}
                          className={`mp-modal-size ${
                            modalSize === s ? "selected" : ""
                          }`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mp-modal-section">
                    <h4>Quantity</h4>
                    <div className="mp-qty">
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

                  <div className="mp-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="mp-modal-actions">
                    <motion.button
                      className="mp-modal-cart"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleModalAddToCart}
                    >
                      <FaShoppingCart /> Add to Cart
                    </motion.button>

                    <motion.button
                      className={`mp-modal-wish ${
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

export default MenPants;
