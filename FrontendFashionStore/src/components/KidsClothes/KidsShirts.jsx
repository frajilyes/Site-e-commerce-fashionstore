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
  FaChild,
  FaRulerVertical,
  FaTshirt,
  FaStar as FaStarSolid,
  FaSearch,
} from "react-icons/fa";
import useCatalog from "../../hooks/useCatalog";
import "./KidsShirts.css";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x1: Math.random() * 100,
  x2: Math.random() * 100,
  size: 2 + Math.random() * 6,
  dur: 12 + Math.random() * 18,
  delay: Math.random() * 10,
  opacity: 0.3 + Math.random() * 0.6,
}));

const SUB_CATEGORIES = [
  "All",
  "T-Shirts",
  "Polo Shirts",
  "Graphic Tees",
  "Long Sleeve",
  "Hoodies",
  "Tank Tops",
  "School Uniform",
  "Party Wear",
];

const SHIRT_SIZES = ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14"];

const AGE_GROUPS = [
  "All",
  "Toddler (2-4)",
  "Kids (5-7)",
  "Tweens (8-12)",
  "Teens (13+)",
];

const GENDER_OPTIONS = ["All", "Boys", "Girls", "Unisex"];

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
      product.gender,
      product.ageGroup,
      product.fit,
      product.neckline,
      product.sleeve,
      ...(product.features || []),
    ]
      .filter(Boolean)
      .join(" "),
  );

const getDiscount = (oldPrice, currentPrice) => {
  if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

const KidsShirts = () => {
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
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [visibleCount, setVisibleCount] = useState(12);


  const sortRef = useRef(null);
  const wishlistTimerRef = useRef(null);


  const allShirts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.audience === "kids" &&
          (product.category === "Shirts" || product.category === "Kids Shirts"),
      ),
    [products],
  );


  const filteredProducts = useMemo(() => {
    let result = [...allShirts];

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
    } else {
      if (activeFilter !== "All") {
        result = result.filter((p) => p.subCategory === activeFilter);
      }

      if (selectedSize) {
        result = result.filter((p) => p.sizes?.includes(selectedSize));
      }

      if (selectedAgeGroup !== "All") {
        result = result.filter((p) => p.ageGroup === selectedAgeGroup);
      }

      if (selectedGender !== "All") {
        result = result.filter(
          (p) => p.gender === selectedGender || p.gender === "Unisex",
        );
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
  }, [
    allShirts,
    searchQuery,
    highlightProductId,
    activeFilter,
    selectedSize,
    selectedAgeGroup,
    selectedGender,
    sortBy,
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const handleLoadMore = () => setVisibleCount((prev) => prev + 12);


  useEffect(() => {
    if (!searchQuery || !highlightProductId) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`product-${highlightProductId}`);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ks-highlight");

      setTimeout(() => {
        element.classList.remove("ks-highlight");
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
    setSelectedSize(null);
    setSelectedAgeGroup("All");
    setSelectedGender("All");
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

  const clearAllFilters = useCallback(() => {
    setActiveFilter("All");
    setSelectedSize(null);
    setSelectedAgeGroup("All");
    setSelectedGender("All");
    setVisibleCount(12);
  }, []);

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
        <div className="ks-glow ksg1" aria-hidden="true" />
        <div className="ks-glow ksg2" aria-hidden="true" />

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
            className="ks-breadcrumb"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span>Home</span> / <span>Shop</span> / <span>Kids</span> /{" "}
            <span className="ks-bread-active">Shirts & Tops</span>
          </motion.div>

          <motion.div
            className="ks-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <FaTshirt className="ks-tag-icon" aria-hidden="true" />
            <FaChild className="ks-tag-icon" aria-hidden="true" />
            Kids Shirts Collection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Fun Fashion for
            <br />
            <span className="ks-neon">Little Champions</span>
          </motion.h1>

          <motion.p
            className="ks-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            From playful graphics to comfy basics — discover the perfect shirt
            <br />
            for every adventure, every smile, every moment.
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
              <FaShieldAlt aria-hidden="true" /> Kid-Safe Materials
            </div>
            <div className="ks-feat">
              <FaUndo aria-hidden="true" /> Easy Returns
            </div>
            <div className="ks-feat">
              <FaRulerVertical aria-hidden="true" /> Size Guide
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
              {SUB_CATEGORIES.map((category) => (
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
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="ks-filter-right">
            {!searchQuery && (
              <>
                <div className="ks-gender-filter">
                  <span className="ks-gender-label">Gender:</span>
                  <select
                    className="ks-gender-select"
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    aria-label="Filter by gender"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ks-age-filter">
                  <span className="ks-age-label">Age:</span>
                  <select
                    className="ks-age-select"
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                    aria-label="Filter by age group"
                  >
                    {AGE_GROUPS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ks-size-filter">
                  <span className="ks-size-label">Size:</span>
                  <div className="ks-size-chips">
                    {SHIRT_SIZES.slice(0, 6).map((s) => (
                      <button
                        key={s}
                        className={`ks-size-btn ${
                          selectedSize === s ? "active" : ""
                        }`}
                        onClick={() =>
                          setSelectedSize(selectedSize === s ? null : s)
                        }
                        type="button"
                        aria-label={`Filter by size ${s}`}
                        aria-pressed={selectedSize === s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

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
                      { value: "low", label: "Price: Low → High" },
                      { value: "high", label: "Price: High → Low" },
                      { value: "rating", label: "Best Rating" },
                      { value: "popular", label: "Most Popular" },
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
              <span>{filteredProducts.length}</span> items
            </span>
          </div>
        </div>

        {!searchQuery && (
          <div className="ks-results-info">
            {activeFilter !== "All" && (
              <span className="ks-active-tag">
                {activeFilter}
                <FaTimes
                  className="ks-clear"
                  onClick={() => setActiveFilter("All")}
                  aria-label={`Remove ${activeFilter} filter`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveFilter("All");
                    }
                  }}
                />
              </span>
            )}
            {selectedGender !== "All" && (
              <span className="ks-active-tag">
                {selectedGender}
                <FaTimes
                  className="ks-clear"
                  onClick={() => setSelectedGender("All")}
                  aria-label={`Remove ${selectedGender} filter`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedGender("All");
                    }
                  }}
                />
              </span>
            )}
            {selectedAgeGroup !== "All" && (
              <span className="ks-active-tag">
                {selectedAgeGroup}
                <FaTimes
                  className="ks-clear"
                  onClick={() => setSelectedAgeGroup("All")}
                  aria-label={`Remove ${selectedAgeGroup} filter`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedAgeGroup("All");
                    }
                  }}
                />
              </span>
            )}
            {selectedSize && (
              <span className="ks-active-tag">
                Size: {selectedSize}
                <FaTimes
                  className="ks-clear"
                  onClick={() => setSelectedSize(null)}
                  aria-label={`Remove size ${selectedSize} filter`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSize(null);
                    }
                  }}
                />
              </span>
            )}
          </div>
        )}
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
                        style={{ background: product.badgeColor }}
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

                    <div className="ks-img-tags">
                      <span className="ks-gender-tag">{product.gender}</span>
                      <span className="ks-age-tag">
                        {product.ageGroup?.split(" ")[0]}
                      </span>
                    </div>

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
                      title={
                        isInWishlist(product.id)
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                      }
                    >
                      <FaHeart aria-hidden="true" />
                    </motion.button>
                  </div>

                  <div className="ks-card-body">
                    <div className="ks-card-author">
                      <span className="ks-brand-dot" aria-hidden="true" />
                      {product.author || "Brand"}
                    </div>

                    <h3 className="ks-card-title">{product.title}</h3>

                    <div className="ks-card-tags">
                      <span className="ks-card-cat">{product.subCategory}</span>
                      <span className="ks-card-fit">{product.fit}</span>
                      <span className="ks-card-gender">{product.gender}</span>
                    </div>

                    <p className="ks-card-desc">
                      {product.description
                        ? `${product.description.substring(0, 85)}...`
                        : "Premium quality product"}
                    </p>

                    <div className="ks-card-features">
                      {product.features?.slice(0, 3).map((f, fi) => (
                        <span key={fi} className="ks-feature-chip">
                          ✓ {f}
                        </span>
                      ))}
                    </div>

                    <div className="ks-card-rating-wrapper">
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
                      <span className="ks-rating-reviews">
                        {product.reviews || 0} reviews
                      </span>
                    </div>

                    {product.colors && product.colors.length > 0 && (
                      <div
                        className="ks-card-colors"
                        aria-label={`${product.colors.length} color options available`}
                      >
                        {product.colors.map((c, ci) => (
                          <span
                            key={ci}
                            className="ks-color-dot"
                            style={{ background: c }}
                            aria-label={`Color option ${ci + 1}`}
                            title={`Color option ${ci + 1}`}
                          />
                        ))}
                        <span className="ks-color-label" aria-hidden="true">
                          {product.colors.length} colors
                        </span>
                      </div>
                    )}

                    <div className="ks-card-sizes">
                      {product.sizes?.slice(0, 4).map((s) => (
                        <span key={s} className="ks-size-mini">
                          {s}
                        </span>
                      ))}
                      {product.sizes && product.sizes.length > 4 && (
                        <span className="ks-size-mini">
                          +{product.sizes.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="ks-sold-info">
                      <FaRegClock aria-hidden="true" />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="ks-card-price">
                      <span className="ks-price-now">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.oldPrice && (
                        <>
                          <span className="ks-price-was">
                            ${product.oldPrice.toFixed(2)}
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
                <div className="ks-no-icon">
                  <FaSearch aria-hidden="true" />
                </div>
                <h3>No items found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "Try adjusting your filters"}
                </p>
                {searchQuery ? (
                  <button
                    className="ks-no-results-btn"
                    onClick={handleClearSearch}
                    type="button"
                    aria-label="Clear search"
                  >
                    <FaTimes aria-hidden="true" /> Clear Search
                  </button>
                ) : (
                  <button
                    className="ks-no-results-btn"
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
          <div className="ks-load-more">
            <motion.button
              className="ks-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Load more items"
              onClick={handleLoadMore}
            >
              Load More Items <FaArrowRight aria-hidden="true" />
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
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  <div className="ks-img-tags ks-tags-modal">
                    <span className="ks-gender-tag">{quickView.gender}</span>
                    <span className="ks-age-tag">
                      {quickView.ageGroup?.split(" ")[0]}
                    </span>
                  </div>
                </div>

                <div className="ks-modal-info">
                  <div className="ks-card-author">
                    <span className="ks-brand-dot" aria-hidden="true" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>

                  <div className="ks-card-tags">
                    <span className="ks-card-cat">{quickView.subCategory}</span>
                    <span className="ks-card-fit">{quickView.fit}</span>
                    <span className="ks-card-gender">{quickView.gender}</span>
                    {quickView.sleeve && (
                      <span className="ks-card-fit">{quickView.sleeve}</span>
                    )}
                  </div>

                  <div className="ks-modal-rating-wrapper">
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

                  <div className="ks-card-price" style={{ margin: "10px 0" }}>
                    <span className="ks-price-now">
                      ${quickView.price.toFixed(2)}
                    </span>
                    {quickView.oldPrice && (
                      <>
                        <span className="ks-price-was">
                          ${quickView.oldPrice.toFixed(2)}
                        </span>
                        <span className="ks-save">
                          -{getDiscount(quickView.oldPrice, quickView.price)}%
                        </span>
                      </>
                    )}
                  </div>

                  <div className="ks-modal-tabs" role="tablist">
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
                          <strong>Fit:</strong> {quickView.fit || "Regular"}
                        </li>
                        <li>
                          <strong>Neckline:</strong>{" "}
                          {quickView.neckline || "Standard"}
                        </li>
                        <li>
                          <strong>Sleeve:</strong>{" "}
                          {quickView.sleeve || "Short Sleeve"}
                        </li>
                        {quickView.features &&
                          quickView.features.length > 0 && (
                            <li>
                              <strong>Features:</strong>{" "}
                              {quickView.features.join(", ")}
                            </li>
                          )}
                        <li>
                          <strong>Brand:</strong> {quickView.author || "Brand"}
                        </li>
                        <li>
                          <strong>Gender:</strong> {quickView.gender}
                        </li>
                        <li>
                          <strong>Age Group:</strong> {quickView.ageGroup}
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
                          <FaTruck aria-hidden="true" /> Free shipping over $25
                        </li>
                        <li>
                          <FaUndo aria-hidden="true" /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt aria-hidden="true" /> Kid-safe materials
                        </li>
                        <li>
                          <FaStarSolid aria-hidden="true" /> Parents' choice
                          approved
                        </li>
                      </ul>
                    )}
                  </div>

                  {quickView.colors && quickView.colors.length > 0 && (
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
                            aria-label={`Color option ${ci + 1}`}
                            aria-pressed={modalColor === c}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {quickView.sizes && quickView.sizes.length > 0 && (
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
                      className={`ks-modal-wish ${
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

export default KidsShirts;
