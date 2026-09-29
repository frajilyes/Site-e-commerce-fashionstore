import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import {
  addToWishlist,
  removeFromWishlist,
} from "../../components/WishList/wishlistSlice";

import {
  FaSearch,
  FaTimes,
  FaTimesCircle,
  FaHeart,
  FaRegClock,
  FaTag,
  FaFeather,
  FaArrowRight,
} from "react-icons/fa";

import useCatalog from "../../hooks/useCatalog";
import "./Search.css";

const ROUTES = {
  men: "/menclothing",
  women: "/womenclothing",
  kids: "/kidsclothing",
};

const AUDIENCE_LABELS = {
  men: "Men's",
  women: "Women's",
  kids: "Kids",
};

const getAudienceFromPath = (pathname = "") => {
  const path = pathname.toLowerCase();
  if (path.includes("/menclothing")) return "men";
  if (path.includes("/womenclothing")) return "women";
  if (path.includes("/kidsclothing")) return "kids";
  return null;
};

const getProductRoute = (product) =>
  ROUTES[product?.audience] ?? "/menclothing";

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getDiscount = (oldPrice, price) => {
  if (!oldPrice || !price || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
};

const getProductSearchText = (product) =>
  normalizeText(
    [
      product.title,
      product.author,
      product.category,
      product.description,
      product.material,
      ...(Array.isArray(product.features) ? product.features : []),
      ...(Array.isArray(product.colors) ? product.colors : []),
      ...(Array.isArray(product.sizes) ? product.sizes : []),
    ]
      .filter(Boolean)
      .join(" ")
  );

const getOccasionColor = (occasion) => {
  if (!occasion) return "#00ff88";
  if (occasion.includes("Business") || occasion.includes("Smart"))
    return "#ffd700";
  if (
    occasion.includes("Athletic") ||
    occasion.includes("Gym") ||
    occasion.includes("Training")
  )
    return "#ff4444";
  if (occasion.includes("Luxury") || occasion.includes("Premium"))
    return "#FFD700";
  if (occasion.includes("Eco") || occasion.includes("Sustainable"))
    return "#2ecc71";
  return "#00ff88";
};

const getFitBadge = (fitType) => {
  switch (fitType) {
    case "slim":
      return {
        bg: "rgba(0, 191, 255, 0.15)",
        color: "#00bfff",
        label: "Slim",
      };
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
      return {
        bg: "rgba(255, 255, 255, 0.1)",
        color: "#ffffff",
        label: "",
      };
  }
};

const ProductCard = ({
  product,
  index,
  isInWishlist,
  onNavigate,
  onToggleWishlist,
}) => {
  const fitBadge = getFitBadge(product.fitType);

  return (
    <motion.div
      className="ws-card"
      variants={{
        hidden: { opacity: 0, y: 60, scale: 0.92 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.5,
            delay: i * 0.08,
            ease: "easeOut",
          },
        }),
        exit: {
          opacity: 0,
          scale: 0.9,
          transition: { duration: 0.3 },
        },
      }}
      initial="hidden"
      whileInView="visible"
      exit="exit"
      viewport={{ once: true }}
      custom={index}
      layout
      onClick={() => onNavigate(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(product);
        }
      }}
    >
      <div className="ws-card-img">
        <img src={product.image} alt={product.title} loading="lazy" />

        {product.fitType && (
          <span
            className="ws-fit-badge"
            style={{
              background: fitBadge.bg,
              color: fitBadge.color,
            }}
          >
            {fitBadge.label}
          </span>
        )}

        {product.badge && (
          <span className="ws-badge" style={{ background: product.badgeColor }}>
            {product.badge}
          </span>
        )}

        {product.oldPrice && (
          <span className="ws-discount-tag">
            -{getDiscount(product.oldPrice, product.price)}%
          </span>
        )}

        {!product.inStock && (
          <div className="ws-sold-out">
            <span>Sold Out</span>
          </div>
        )}

        <button
          type="button"
          className={`ws-heart${isInWishlist ? " liked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isInWishlist}
        >
          <FaHeart aria-hidden="true" />
        </button>
      </div>

      <div className="ws-card-body">
        <div className="ws-card-author">
          <span className="ws-brand-dot" aria-hidden="true" />
          {product.author || "Brand"}
        </div>

        <h3 className="ws-card-title">{product.title}</h3>

        <span className="ws-card-cat">
          {product.subCategory || product.category}
        </span>

        {product.occasion && (
          <div className="ws-occasion">
            <FaTag className="ws-occasion-icon" aria-hidden="true" />
            <span style={{ color: getOccasionColor(product.occasion) }}>
              {product.occasion}
            </span>
          </div>
        )}

        {product.weight && (
          <div className="ws-weight-info">
            <FaFeather aria-hidden="true" />
            <span>{product.weight}</span>
          </div>
        )}

        <div className="ws-sold-info">
          <FaRegClock aria-hidden="true" />
          <span>{(product.soldCount ?? 0).toLocaleString()} sold</span>
        </div>

        <div className="ws-card-price">
          <span className="ws-price-now">${product.price}</span>
          {product.oldPrice && (
            <>
              <span className="ws-price-was">${product.oldPrice}</span>
              <span className="ws-save-tag">
                Save ${(product.oldPrice - product.price).toFixed(2)}
              </span>
            </>
          )}
        </div>

        <div className="ws-card-btns">
          <button
            type="button"
            className="ws-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(product);
            }}
            aria-label={`View ${product.title}`}
          >
            <FaArrowRight aria-hidden="true" /> Voir
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Search = ({ isOpen = true, onClose }) => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const closeSearch = useCallback(() => {
    if (onClose) onClose();
    else navigate("/");
  }, [onClose, navigate]);

  const wishlist = useSelector((state) => state?.wishlist?.items ?? []);

  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const inputRef = useRef(null);
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobile, isOpen]);

  const currentAudience = useMemo(
    () => getAudienceFromPath(location.pathname),
    [location.pathname]
  );

  const collectionLabel = useMemo(
    () =>
      currentAudience
        ? `${AUDIENCE_LABELS[currentAudience]} collection`
        : "all collections",
    [currentAudience]
  );

  const normalizedQuery = useMemo(() => normalizeText(query), [query]);

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    const base = products.filter((product) => {
      if (currentAudience && product.audience !== currentAudience) return false;
      return true;
    });

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return base
      .filter((p) => {
        const text = getProductSearchText(p);
        return tokens.every((tok) => text.includes(tok));
      })
      .slice(0, 20);
  }, [products, normalizedQuery, currentAudience]);

  const hasActiveSearch = normalizedQuery.length > 0;
  const showResults = hasActiveSearch && results.length > 0;
  const showNoResults = hasActiveSearch && results.length === 0;

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeSearch]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (isMobile) return;
      if (e.target === e.currentTarget) {
        closeSearch();
      }
    },
    [isMobile, closeSearch]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const toggleWishlist = useCallback(
    (product) => {
      const exists = wishlist.some((item) => item.id === product.id);
      dispatch(
        exists ? removeFromWishlist(product.id) : addToWishlist(product)
      );
    },
    [dispatch, wishlist]
  );

  const navigateToProduct = useCallback(
    (product) => {
      const route = getProductRoute(product);
      setQuery("");
      closeSearch();
      navigate(
        `${route}?search=${encodeURIComponent(product.title)}&productId=${
          product.id
        }`
      );
    },
    [navigate, closeSearch]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="search-panel"
        className="search-navbar-container"
        initial={{ opacity: 0, y: isMobile ? "100%" : -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isMobile ? "100%" : -20 }}
        transition={{
          duration: isMobile ? 0.35 : 0.25,
          ease: isMobile ? [0.4, 0, 0.2, 1] : "easeOut"
        }}
        onClick={handleBackdropClick}
      >
        <div
          className="search-navbar-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="search-navbar-input-wrapper">
            <FaSearch className="search-navbar-icon" aria-hidden="true" />

            <input
              ref={inputRef}
              type="search"
              value={query}
              className="search-navbar-input"
              placeholder="Search your favorite Styles"
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
              autoComplete="off"
              spellCheck="false"
            />

            {query.length > 0 && (
              <button
                type="button"
                className="search-navbar-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimesCircle aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              className="search-navbar-close-btn"
              onClick={closeSearch}
              aria-label="Close search"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>

          {(showResults || showNoResults) && (
            <div className="search-navbar-results">
              {showNoResults && (
                <motion.div
                  className="search-navbar-no-results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaSearch
                    className="search-navbar-no-results-icon"
                    aria-hidden="true"
                  />
                  <h3>No product found</h3>
                  <p>
                    No products match <strong>"{query}"</strong> in{" "}
                    <strong>{collectionLabel}</strong>.
                  </p>

                  <div className="search-no-results-actions">
                    <button
                      type="button"
                      className="example-tag"
                      onClick={clearSearch}
                    >
                      Clear search text
                    </button>
                  </div>
                </motion.div>
              )}

              {showResults && (
                <div className="search-navbar-results-list">
                  <motion.div
                    className="search-navbar-results-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span>
                      Found <strong>{results.length}</strong>{" "}
                      {results.length === 1 ? "product" : "products"} for{" "}
                      <strong>"{query}"</strong>
                    </span>
                  </motion.div>

                  <div className="search-navbar-products-grid">
                    <AnimatePresence mode="popLayout">
                      {results.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={index}
                          isInWishlist={wishlist.some(
                            (item) => item.id === product.id
                          )}
                          onNavigate={navigateToProduct}
                          onToggleWishlist={toggleWishlist}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Search;
