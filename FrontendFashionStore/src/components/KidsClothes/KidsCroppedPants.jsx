import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../pages/Checkout/cartSlice";
import { addToWishlist, removeFromWishlist } from "../../components/WishList/wishlistSlice";
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
  FaRulerHorizontal,
  FaTshirt,
  FaWalking,
  FaChild,
  FaSmile,
  FaStar as FaStarSolid,
  FaPencilRuler,
  FaSearch,
} from "react-icons/fa";

import "./KidsCroppedPants.css";


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
  "Chino Crop",
  "Denim Crop",
  "Jogger Crop",
  "Cargo Crop",
  "Leggings Crop",
  "Shorts Crop",
  "Linen Crop",
  "Sport Crop",
];

const AGE_GROUPS = [
  { id: "all", label: "All Ages", icon: null },
  { id: "toddler", label: "2-4 Years", icon: FaChild },
  { id: "kids", label: "5-8 Years", icon: FaSmile },
  { id: "junior", label: "9-12 Years", icon: FaStarSolid },
];

const FIT_TYPES = [
  { id: "all", label: "All Fits", icon: null },
  { id: "slim", label: "Slim Fit", icon: FaTshirt },
  { id: "regular", label: "Regular Fit", icon: FaWalking },
  { id: "relaxed", label: "Relaxed Fit", icon: FaRulerHorizontal },
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
      product.subCategory,
      product.description,
      product.material,
      product.ageGroup,
      product.ageRange,
      product.fitType,
      product.occasion,
      ...(product.features || []),
    ]
      .filter(Boolean)
      .join(" "),
  );

const getDiscount = (oldPrice, currentPrice) => {
  if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

const getAgeGroupBadge = (ageGroup) => {
  switch (ageGroup) {
    case "toddler":
      return {
        bg: "rgba(255, 105, 180, 0.15)",
        color: "#FF69B4",
        label: "2-4Y",
      };
    case "kids":
      return { bg: "rgba(0, 191, 255, 0.15)", color: "#00bfff", label: "5-8Y" };
    case "junior":
      return {
        bg: "rgba(255, 215, 0, 0.15)",
        color: "#FFD700",
        label: "9-12Y",
      };
    default:
      return { bg: "rgba(0, 255, 136, 0.15)", color: "#00ff88", label: "All" };
  }
};

const getFitBadge = (fitType) => {
  switch (fitType) {
    case "slim":
      return { bg: "rgba(0, 191, 255, 0.15)", color: "#00bfff", label: "Slim" };
    case "regular":
      return {
        bg: "rgba(0, 255, 136, 0.15)",
        color: "#00ff88",
        label: "Regular",
      };
    case "relaxed":
      return {
        bg: "rgba(255, 136, 0, 0.15)",
        color: "#ff8800",
        label: "Relaxed",
      };
    default:
      return { bg: "rgba(255, 255, 255, 0.1)", color: "#ffffff", label: "" };
  }
};

const getOccasionColor = (occasion) => {
  if (!occasion) return "#00ff88";
  if (occasion.includes("School") || occasion.includes("Special"))
    return "#FFD700";
  if (
    occasion.includes("Sports") ||
    occasion.includes("Active") ||
    occasion.includes("Performance") ||
    occasion.includes("Training")
  )
    return "#ff4444";
  if (
    occasion.includes("Outdoor") ||
    occasion.includes("Adventure") ||
    occasion.includes("Hiking")
  )
    return "#2ecc71";
  if (occasion.includes("Summer") || occasion.includes("Beach"))
    return "#00bfff";
  return "#00ff88";
};


const KidsCroppedPants = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const allCroppedPants = useMemo(
    () =>
      products.filter(
        (product) =>
          product.audience === "kids" &&
          (product.title?.toLowerCase().includes("crop") ||
            product.description?.toLowerCase().includes("crop") ||
            product.subCategory?.includes("Crop") ||
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


  const [activeFilter, setActiveFilter] = useState("All");
  const [activeAgeGroup, setActiveAgeGroup] = useState("all");
  const [activeFit, setActiveFit] = useState("all");
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
    let result = [...allCroppedPants];

    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

      result = result.filter((product) => {
        const text = getProductSearchText(product);
        return tokens.every((token) => text.includes(token));
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
        result = result.filter(
          (p) => p.subCategory === activeFilter || p.category === activeFilter,
        );
      }

      if (activeAgeGroup !== "all") {
        result = result.filter((p) => p.ageGroup === activeAgeGroup);
      }

      if (activeFit !== "all") {
        result = result.filter((p) => p.fitType === activeFit);
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
    allCroppedPants,
    searchQuery,
    highlightProductId,
    activeFilter,
    activeAgeGroup,
    activeFit,
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
      element.classList.add("kcp-highlight");

      setTimeout(() => {
        element.classList.remove("kcp-highlight");
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
            category: product.subCategory || "Kids Crop Pants",
            rating: product.rating,
            reviews: product.reviews,
            audience: product.audience || "kids",
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
          size: product.sizes?.[0] || "M",
          color: product.colors?.[0] || "Default",
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
    setModalSize(product.sizes?.[0] || null);
    setModalColor(product.colors?.[0] || null);
    setModalTab("description");
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setQuickView(null);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchParams({});
    setActiveFilter("All");
    setActiveAgeGroup("all");
    setActiveFit("all");
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
    <div className="kcp-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="kcp-wishlist-toast"
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
                  ? "kcp-toast-heart-added"
                  : "kcp-toast-heart-removed"
              }
            />
            {wishlistNotif === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="kcp-hero">
        <div className="kcp-hero-bg" aria-hidden="true" />
        <div className="kcp-hero-overlay" aria-hidden="true" />
        <div className="kcp-hero-gradient" aria-hidden="true" />
        <div className="kcp-glow g1" aria-hidden="true" />
        <div className="kcp-glow g2" aria-hidden="true" />
        <div className="kcp-glow g3" aria-hidden="true" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="kcp-particle"
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

        <div className="kcp-hero-content">
          <motion.div
            className="kcp-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="kcp-tag-dot" />
            Kids Cropped Pants 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Fun & Comfortable
            <br />
            <span className="kcp-neon">Kids Cropped Pants</span>
          </motion.h1>

          <motion.p
            className="kcp-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Durable, comfortable, and fun cropped pants for active kids.
            <br />
            From toddlers to juniors - built for play and adventure!
          </motion.p>

          <motion.div
            className="kcp-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="kcp-feature">
              <FaChild aria-hidden="true" /> Age-Appropriate
            </div>
            <div className="kcp-feature">
              <FaShieldAlt aria-hidden="true" /> Durable & Safe
            </div>
            <div className="kcp-feature">
              <FaPencilRuler aria-hidden="true" /> Easy Care
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {searchQuery && (
          <motion.div
            className="kcp-search-info-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            role="status"
            aria-live="polite"
          >
            <div className="kcp-search-info-content">
              <FaSearch className="kcp-search-info-icon" aria-hidden="true" />
              <span>
                Showing results for: <strong>"{searchQuery}"</strong>
              </span>
              <span className="kcp-search-info-count">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <button
              className="kcp-search-clear-btn"
              onClick={handleClearSearch}
              type="button"
              aria-label="Clear search results"
            >
              <FaTimes aria-hidden="true" /> Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="kcp-age-bar" aria-label="Age group filters">
        <div className="kcp-age-row">
          {AGE_GROUPS.map((g) => {
            const Icon = g.icon;
            return (
              <motion.button
                key={g.id}
                className={[
                  "kcp-age-chip",
                  activeAgeGroup === g.id ? "active" : "",
                  searchQuery ? "disabled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  if (!searchQuery) setActiveAgeGroup(g.id); setVisibleCount(12);
                }}
                whileHover={{ scale: searchQuery ? 1 : 1.05 }}
                whileTap={{ scale: searchQuery ? 1 : 0.95 }}
                disabled={!!searchQuery}
                type="button"
                aria-pressed={activeAgeGroup === g.id}
              >
                {Icon && <Icon className="chip-icon" />}
                {g.label}
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="kcp-fit-bar" aria-label="Fit type filters">
        <div className="kcp-fit-row">
          {FIT_TYPES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.button
                key={f.id}
                className={[
                  "kcp-fit-chip",
                  activeFit === f.id ? "active" : "",
                  searchQuery ? "disabled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  if (!searchQuery) setActiveFit(f.id); setVisibleCount(12);
                }}
                whileHover={{ scale: searchQuery ? 1 : 1.05 }}
                whileTap={{ scale: searchQuery ? 1 : 0.95 }}
                disabled={!!searchQuery}
                type="button"
                aria-pressed={activeFit === f.id}
              >
                {Icon && <Icon className="chip-icon" />}
                {f.label}
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="kcp-filter-bar" aria-label="Product filters">
        <div className="kcp-filter-row">
          <div className="kcp-filter-left">
            <FaFilter className="kcp-filter-icon" aria-hidden="true" />

            {searchQuery && (
              <div className="kcp-filter-search-mode">
                <FaSearch style={{ marginRight: "8px", fontSize: "12px" }} />
                <span>
                  Filtering by search: <strong>"{searchQuery}"</strong>
                </span>
              </div>
            )}

            <div
              className="kcp-chips"
              role="group"
              aria-label="Category filters"
            >
              {CATEGORIES.map((category) => (
                <motion.button
                  key={category}
                  className={[
                    "kcp-chip",
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

          <div className="kcp-filter-right">
            <div className="kcp-sort-wrap" ref={sortRef}>
              <button
                className="kcp-sort-btn"
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
                    className="kcp-sort-drop"
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
                          "kcp-sort-item",
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

            <span className="kcp-count" aria-live="polite">
              <span>{filteredProducts.length}</span> pants found
            </span>
          </div>
        </div>
      </section>

      <section className="kcp-grid-section" aria-label="Products grid">
        <motion.div className="kcp-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              visibleProducts.map((product, index) => {
                const ageBadge = getAgeGroupBadge(product.ageGroup);
                const fitBadge = getFitBadge(product.fitType);

                return (
                  <motion.article
                    className="kcp-card"
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
                    <div className="kcp-card-img">
                      <img
                        src={product.image}
                        alt={product.title}
                        loading="lazy"
                        width="500"
                        height="500"
                      />

                      {product.ageGroup && (
                        <span
                          className="kcp-age-badge"
                          style={{
                            background: ageBadge.bg,
                            color: ageBadge.color,
                          }}
                          aria-label={`Age: ${ageBadge.label}`}
                        >
                          {ageBadge.label}
                        </span>
                      )}

                      {product.fitType && (
                        <span
                          className="kcp-fit-badge"
                          style={{
                            background: fitBadge.bg,
                            color: fitBadge.color,
                          }}
                          aria-label={`Fit: ${fitBadge.label}`}
                        >
                          {fitBadge.label}
                        </span>
                      )}

                      {product.badge && (
                        <span
                          className="kcp-badge"
                          style={{ background: product.badgeColor }}
                          aria-label={`Badge: ${product.badge}`}
                        >
                          {product.badge}
                        </span>
                      )}

                      {product.oldPrice && (
                        <span
                          className="kcp-discount-tag"
                          aria-label={`${getDiscount(product.oldPrice, product.price)}% discount`}
                        >
                          -{getDiscount(product.oldPrice, product.price)}%
                        </span>
                      )}

                      {!product.inStock && (
                        <div className="kcp-sold-out" aria-label="Out of stock">
                          <span>Sold Out</span>
                        </div>
                      )}

                      <motion.button
                        className={`kcp-heart ${isInWishlist(product.id) ? "liked" : ""}`}
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

                    <div className="kcp-card-body">
                      <div className="kcp-card-author">
                        <span className="kcp-brand-dot" aria-hidden="true" />
                        {product.author || "Brand"}
                      </div>

                      <h3 className="kcp-card-title">{product.title}</h3>
                      <span className="kcp-card-cat">
                        {product.subCategory || product.category}
                      </span>

                      {product.occasion && (
                        <div className="kcp-occasion">
                          <FaWalking
                            className="occasion-icon"
                            aria-hidden="true"
                          />
                          <span
                            style={{
                              color: getOccasionColor(product.occasion),
                            }}
                          >
                            {product.occasion}
                          </span>
                        </div>
                      )}

                      <p className="kcp-card-desc">
                        {product.description
                          ? `${product.description.substring(0, 80)}...`
                          : "Premium quality cropped pants for kids"}
                      </p>

                      <div className="kcp-card-rating-wrapper">
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
                        <span className="kcp-rating-reviews">
                          {product.reviews || 0} reviews
                        </span>
                      </div>

                      {product.colors && product.colors.length > 0 && (
                        <div
                          className="kcp-card-colors"
                          aria-label={`${product.colors.length} color options available`}
                        >
                          {product.colors.map((c, ci) => (
                            <span
                              key={ci}
                              className="kcp-color-mini"
                              style={{ background: c }}
                              aria-label={`Color option ${ci + 1}`}
                              title={`Color option ${ci + 1}`}
                            />
                          ))}
                          <span className="kcp-color-count" aria-hidden="true">
                            {product.colors.length} colors
                          </span>
                        </div>
                      )}

                      {product.features && product.features.length > 0 && (
                        <div className="kcp-features-mini">
                          {product.features.slice(0, 2).map((f, fi) => (
                            <span key={fi} className="kcp-feature-tag">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {product.inseam && (
                        <div className="kcp-inseam-info">
                          <FaRulerHorizontal aria-hidden="true" />
                          <span>Inseam: {product.inseam}</span>
                        </div>
                      )}

                      <div className="kcp-sold-info">
                        <FaRegClock aria-hidden="true" />
                        <span>
                          {(product.soldCount || 0).toLocaleString()} sold
                        </span>
                      </div>

                      <div className="kcp-card-price">
                        <span className="kcp-price-now">${product.price}</span>
                        {product.oldPrice && (
                          <>
                            <span className="kcp-price-was">
                              ${product.oldPrice}
                            </span>
                            <span className="kcp-save-tag">
                              Save $
                              {(
                                (product.oldPrice || product.price) -
                                product.price
                              ).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="kcp-card-btns">
                        <motion.button
                          className={`kcp-add-btn ${animatingCart === product.id || isInCart(product.id) ? "added" : ""}`}
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
                          className="kcp-view-btn"
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
                );
              })
            ) : (
              <motion.div
                className="kcp-no-results"
                key="no-results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                role="status"
                aria-live="polite"
                style={{ textAlign: "center", padding: "40px" }}
              >
                <FaSearch
                  className="kcp-no-results-icon"
                  aria-hidden="true"
                  style={{ fontSize: "48px", color: "#666" }}
                />
                <h3>No cropped pants found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "Try selecting different filters."}
                </p>
                {searchQuery && (
                  <button
                    className="kcp-clear-search-btn"
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
          <div className="kcp-load-more">
            <motion.button
              className="kcp-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Load more products"
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
            className="kcp-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseQuickView}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${quickView.title}`}
          >
            <motion.div
              className="kcp-modal"
              variants={ANIMATION_VARIANTS.modal}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="kcp-modal-close"
                onClick={handleCloseQuickView}
                type="button"
                aria-label="Close quick view modal"
              >
                <FaTimes aria-hidden="true" />
              </button>

              <div className="kcp-modal-grid">
                <div className="kcp-modal-img">
                  <img
                    src={quickView.image}
                    alt={quickView.title}
                    loading="lazy"
                    width="500"
                    height="500"
                  />
                  {quickView.badge && (
                    <span
                      className="kcp-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  {quickView.ageGroup && (
                    <span
                      className="kcp-modal-age-badge"
                      style={{
                        background: getAgeGroupBadge(quickView.ageGroup).bg,
                        color: getAgeGroupBadge(quickView.ageGroup).color,
                      }}
                    >
                      {getAgeGroupBadge(quickView.ageGroup).label}
                    </span>
                  )}
                </div>

                <div className="kcp-modal-info">
                  <div className="kcp-card-author">
                    <span className="kcp-brand-dot" aria-hidden="true" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>
                  <span className="kcp-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div className="kcp-modal-fit-info">
                    {quickView.ageGroup && (
                      <div className="kcp-fit-detail">
                        <FaChild className="fit-icon" aria-hidden="true" />
                        <span>
                          Age: {getAgeGroupBadge(quickView.ageGroup).label}
                        </span>
                      </div>
                    )}
                    {quickView.fitType && (
                      <div className="kcp-fit-detail">
                        <FaTshirt className="fit-icon" aria-hidden="true" />
                        <span>Fit: {getFitBadge(quickView.fitType).label}</span>
                      </div>
                    )}
                    {quickView.inseam && (
                      <div className="kcp-fit-detail">
                        <FaRulerHorizontal
                          className="fit-icon"
                          aria-hidden="true"
                        />
                        <span>Inseam: {quickView.inseam}</span>
                      </div>
                    )}
                    {quickView.occasion && (
                      <div className="kcp-fit-detail">
                        <FaWalking className="fit-icon" aria-hidden="true" />
                        <span>Occasion: {quickView.occasion}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="kcp-modal-rating-wrapper"
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

                  <div className="kcp-card-price" style={{ margin: "10px 0" }}>
                    <span className="kcp-price-now">${quickView.price}</span>
                    {quickView.oldPrice && (
                      <>
                        <span className="kcp-price-was">
                          ${quickView.oldPrice}
                        </span>
                        <span className="kcp-save-tag">
                          -{getDiscount(quickView.oldPrice, quickView.price)}%
                        </span>
                      </>
                    )}
                  </div>

                  <div className="kcp-modal-tabs" role="tablist">
                    {["description", "details", "care", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`kcp-tab ${modalTab === tab ? "active" : ""}`}
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
                    className="kcp-tab-content"
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
                          "Premium quality cropped pants for kids."}
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
                        {quickView.ageGroup && (
                          <li>
                            <strong>Age Group:</strong>{" "}
                            {getAgeGroupBadge(quickView.ageGroup).label}
                          </li>
                        )}
                        {quickView.fitType && (
                          <li>
                            <strong>Fit Type:</strong>{" "}
                            {getFitBadge(quickView.fitType).label}
                          </li>
                        )}
                        {quickView.inseam && (
                          <li>
                            <strong>Inseam:</strong> {quickView.inseam}
                          </li>
                        )}
                        {quickView.rise && (
                          <li>
                            <strong>Rise:</strong> {quickView.rise}
                          </li>
                        )}
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount || 0).toLocaleString()} units
                        </li>
                      </ul>
                    )}
                    {modalTab === "care" && (
                      <ul>
                        <li>
                          <FaCheck
                            style={{ color: "#00ff88" }}
                            aria-hidden="true"
                          />{" "}
                          Machine washable
                        </li>
                        <li>
                          <FaCheck
                            style={{ color: "#00ff88" }}
                            aria-hidden="true"
                          />{" "}
                          Tumble dry low
                        </li>
                        <li>
                          <FaCheck
                            style={{ color: "#00ff88" }}
                            aria-hidden="true"
                          />{" "}
                          Durable construction
                        </li>
                        <li>
                          <FaCheck
                            style={{ color: "#00ff88" }}
                            aria-hidden="true"
                          />{" "}
                          Kid-safe materials
                        </li>
                        {quickView.features?.some((f) =>
                          f.toLowerCase().includes("knee"),
                        ) && (
                          <li>
                            <FaCheck
                              style={{ color: "#00ff88" }}
                              aria-hidden="true"
                            />{" "}
                            Reinforced knees
                          </li>
                        )}
                        <li>
                          <FaTruck aria-hidden="true" /> Free shipping on orders
                          over $50
                        </li>
                        <li>
                          <FaUndo aria-hidden="true" /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt aria-hidden="true" /> 6-month quality
                          guarantee
                        </li>
                      </ul>
                    )}
                  </div>

                  {quickView.colors && quickView.colors.length > 0 && (
                    <div className="kcp-modal-section">
                      <h4 id="color-label">Color</h4>
                      <div
                        className="kcp-modal-colors"
                        role="group"
                        aria-labelledby="color-label"
                      >
                        {quickView.colors.map((c, ci) => (
                          <button
                            key={ci}
                            className={`kcp-modal-color ${modalColor === c ? "selected" : ""}`}
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
                    <div className="kcp-modal-section">
                      <h4 id="size-label">Size</h4>
                      <div
                        className="kcp-modal-sizes"
                        role="group"
                        aria-labelledby="size-label"
                      >
                        {quickView.sizes.map((s) => (
                          <button
                            key={s}
                            className={`kcp-modal-size ${modalSize === s ? "selected" : ""}`}
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

                  <div className="kcp-modal-section">
                    <h4 id="qty-label">Quantity</h4>
                    <div
                      className="kcp-qty"
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

                  <div className="kcp-modal-total">
                    Total:{" "}
                    <span aria-live="polite" aria-atomic="true">
                      ${(quickView.price * modalQty).toFixed(2)}
                    </span>
                  </div>

                  <div className="kcp-modal-actions">
                    <motion.button
                      className="kcp-modal-cart"
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
                      className={`kcp-modal-wish ${isInWishlist(quickView.id) ? "wished" : ""}`}
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

export default KidsCroppedPants;
