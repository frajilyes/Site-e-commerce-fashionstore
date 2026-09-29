import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FaRulerVertical,
  FaVenus,
  FaTshirt,
} from "react-icons/fa";
import "./WomenPants.css";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x1: parseFloat((Math.random() * 100).toFixed(2)),
  x2: parseFloat((Math.random() * 100).toFixed(2)),
  size: parseFloat((2 + Math.random() * 5).toFixed(2)),
  dur: parseFloat((14 + Math.random() * 16).toFixed(2)),
  delay: parseFloat((Math.random() * 8).toFixed(2)),
  opacity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
}));

const categories = [
  "All",
  "Jeans",
  "Trousers",
  "Leggings",
  "Joggers",
  "Wide Leg",
  "Cargo",
  "Straight",
  "Skinny",
  "High Waist",
];

const fitTypes = [
  { id: "all", label: "All Fits", icon: null },
  { id: "skinny", label: "Skinny Fit", icon: FaRulerVertical },
  { id: "straight", label: "Straight Fit", icon: FaTshirt },
  { id: "relaxed", label: "Relaxed Fit", icon: FaVenus },
];

const getFitBadge = (fitType) => {
  switch (fitType) {
    case "skinny":
      return {
        bg: "rgba(0, 255, 136, 0.15)",
        color: "#00ff88",
        label: "Skinny",
      };
    case "straight":
      return {
        bg: "rgba(0, 255, 136, 0.15)",
        color: "#00ff88",
        label: "Straight",
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

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.85, y: 30, transition: { duration: 0.25 } },
};

const WomenPants = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();

  const allPants = products.filter(
    (product) =>
      product.audience === "women" &&
      (product.type === "Pants" ||
        product.subCategory?.includes("Jeans") ||
        product.subCategory?.includes("Trousers") ||
        product.subCategory?.includes("Leggings") ||
        product.subCategory?.includes("Joggers") ||
        categories.includes(product.subCategory)),
  );

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const userRatings = useSelector((state) => state.ratings.userRatings);
  const cartItems = useSelector((state) => state.cart.items);

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeFit, setActiveFit] = useState("all");
  const [quickView, setQuickView] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [modalQty, setModalQty] = useState(1);
  const [modalSize, setModalSize] = useState(null);
  const [modalColor, setModalColor] = useState(null);
  const [modalTab, setModalTab] = useState("description");
  const [animatingCart, setAnimatingCart] = useState(null);

  const [wishlistNotif, setWishlistNotif] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const handleRateProduct = (productId, rating) => {
    dispatch(setRating({ productId, rating }));
  };

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);
  const isInCart = (id) => cartItems.some((item) => item.id === id);

  let filtered =
    activeFilter === "All"
      ? [...allPants]
      : allPants.filter((p) => p.subCategory === activeFilter);

  if (activeFit !== "all")
    filtered = filtered.filter((p) => p.fitType === activeFit);

  if (sortBy === "low") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "high") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "rating")
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sortBy === "popular")
    filtered.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const handleLoadMore = () => setVisibleCount((prev) => prev + 12);

  const handleToggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      dispatch(removeFromWishlist(product.id));
      setWishlistNotif({ id: product.id, action: "removed" });
    } else {
      dispatch(
        addToWishlist({
          id: product.id,
          name: product.title,
          price: product.price,
          image: product.image,
          author: product.author,
          category: product.subCategory || "Pants",
          rating: product.rating,
          reviews: product.reviews,
        }),
      );
      setWishlistNotif({ id: product.id, action: "added" });
    }

    setTimeout(() => setWishlistNotif(null), 2000);
  };

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.title,
        price: product.price,
        image: product.image,
        size: product.sizes?.[0] || "M",
        color: product.colors?.[0] || "Default",
        quantity: 1,
      }),
    );
    setAnimatingCart(product.id);
    setTimeout(() => setAnimatingCart(null), 2000);
  };

  const handleModalAddToCart = () => {
    if (!quickView) return;
    dispatch(
      addToCart({
        id: quickView.id,
        name: quickView.title,
        price: quickView.price,
        image: quickView.image,
        size: modalSize,
        color: modalColor,
        quantity: modalQty,
      }),
    );
    setAnimatingCart(quickView.id);
    setTimeout(() => setAnimatingCart(null), 2000);
  };

  const openQuickView = (product) => {
    setQuickView(product);
    setModalQty(1);
    setModalSize(product.sizes?.[0] || null);
    setModalColor(product.colors?.[0] || null);
    setModalTab("description");
  };

  const getDiscount = (old, curr) => Math.round(((old - curr) / old) * 100);

  return (
    <div className="wpants-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="wpants-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FaHeart
              className={
                wishlistNotif.action === "added"
                  ? "wpants-toast-heart-added"
                  : "wpants-toast-heart-removed"
              }
            />
            {wishlistNotif.action === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="wpants-hero">
        <div className="wpants-hero-bg" />
        <div className="wpants-hero-overlay" />
        <div className="wpants-hero-gradient" />
        <div className="wpants-glow g1" />
        <div className="wpants-glow g2" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="wpants-particle"
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

        <div className="wpants-hero-content">
          <motion.div
            className="wpants-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="wpants-tag-dot" /> Women's Pants Collection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Elegant Styles,
            <br />
            <span className="wpants-neon">Perfect Fit</span>
          </motion.h1>

          <motion.p
            className="wpants-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Discover the perfect pants for every occasion.
            <br />
            From classic jeans to elegant trousers.
          </motion.p>

          <motion.div
            className="wpants-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="wpants-feature">
              <FaRulerVertical /> Perfect Fit
            </div>
            <div className="wpants-feature">
              <FaVenus /> Flattering Cuts
            </div>
            <div className="wpants-feature">
              <FaTshirt /> Premium Quality
            </div>
          </motion.div>
        </div>
      </section>

      <section className="wpants-fit-bar">
        <div className="wpants-fit-row">
          {fitTypes.map((f) => (
            <motion.button
              key={f.id}
              className={`wpants-fit-chip ${activeFit === f.id ? "active" : ""}`}
              onClick={() => { setActiveFit(f.id); setVisibleCount(12); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {f.icon && <f.icon className="chip-icon" />}
              {f.label}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="wpants-filter-bar">
        <div className="wpants-filter-row">
          <div className="wpants-filter-left">
            <FaFilter className="wpants-filter-icon" />
            <div className="wpants-chips">
              {categories.map((c, i) => (
                <motion.button
                  key={i}
                  className={`wpants-chip ${activeFilter === c ? "active" : ""}`}
                  onClick={() => { setActiveFilter(c); setVisibleCount(12); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="wpants-filter-right">
            <div className="wpants-sort-wrap">
              <button
                className="wpants-sort-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                Sort By <FaChevronDown />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="wpants-sort-drop"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {[
                      { v: "default", l: "Default" },
                      { v: "low", l: "Price: Low → High" },
                      { v: "high", l: "Price: High → Low" },
                      { v: "rating", l: "Best Rating" },
                      { v: "popular", l: "Most Popular" },
                    ].map((s) => (
                      <div
                        key={s.v}
                        className={`wpants-sort-item ${sortBy === s.v ? "active" : ""}`}
                        onClick={() => {
                          setSortBy(s.v);
                          setSortOpen(false);
                          setVisibleCount(12);
                        }}
                      >
                        {s.l}
                        {sortBy === s.v && <FaCheck />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="wpants-count">
              <span>{filtered.length}</span> pants found
            </span>
          </div>
        </div>
      </section>

      <section className="wpants-grid-section">
        <motion.div className="wpants-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, i) => {
              const fitBadge = getFitBadge(product.fitType);
              return (
                <motion.div
                  className="wpants-card"
                  key={product.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  exit="exit"
                  viewport={{ once: true }}
                  custom={i}
                  layout
                >
                  <div className="wpants-card-img">
                    <img src={product.image} alt={product.title} />
                    <span
                      className="wpants-fit-badge"
                      style={{ background: fitBadge.bg, color: fitBadge.color }}
                    >
                      {fitBadge.label}
                    </span>
                    {product.badge && (
                      <span
                        className="wpants-badge"
                        style={{ background: product.badgeColor }}
                      >
                        {product.badge}
                      </span>
                    )}
                    <span className="wpants-discount-tag">
                      -
                      {getDiscount(
                        product.oldPrice || product.price,
                        product.price,
                      )}
                      %
                    </span>
                    {!product.inStock && (
                      <div className="wpants-sold-out">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`wpants-heart ${isInWishlist(product.id) ? "liked" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product);
                      }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      title={
                        isInWishlist(product.id)
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                      }
                    >
                      <FaHeart />
                    </motion.button>
                  </div>

                  <div className="wpants-card-body">
                    <div className="wpants-card-author">
                      <span className="wpants-brand-dot" />
                      {product.author || "Brand"}
                    </div>
                    <h3 className="wpants-card-title">{product.title}</h3>
                    <span className="wpants-card-cat">
                      {product.subCategory || product.category}
                    </span>

                    <p className="wpants-card-desc">
                      {product.description?.substring(0, 80) ||
                        "Premium quality pants"}
                      ...
                    </p>

                    <div className="kc-card-rating-wrapper">
                      <StarRating
                        currentRating={product.rating || 0}
                        userRating={userRatings[product.id] || null}
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

                    <div className="wpants-card-colors">
                      {(product.colors || []).map((c, ci) => (
                        <span
                          key={ci}
                          className="wpants-color-mini"
                          style={{ background: c }}
                        />
                      ))}
                      <span className="wpants-color-count">
                        {(product.colors || []).length} colors
                      </span>
                    </div>

                    <div className="wpants-features-mini">
                      {(product.features || []).slice(0, 2).map((f, fi) => (
                        <span key={fi} className="wpants-feature-tag">
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="wpants-sold-info">
                      <FaRegClock />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="wpants-card-price">
                      <span className="wpants-price-now">${product.price}</span>
                      <span className="wpants-price-was">
                        ${product.oldPrice || product.price}
                      </span>
                      <span className="wpants-save-tag">
                        Save $
                        {(
                          (product.oldPrice || product.price) - product.price
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="wpants-card-btns">
                      <motion.button
                        className={`wpants-add-btn ${animatingCart === product.id || isInCart(product.id) ? "added" : ""}`}
                        onClick={() => handleAddToCart(product)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!product.inStock}
                      >
                        {animatingCart === product.id ||
                        isInCart(product.id) ? (
                          <>
                            <FaCheck /> Added
                          </>
                        ) : (
                          <>
                            <FaShoppingCart /> Add to Cart
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        className="wpants-view-btn"
                        onClick={() => openQuickView(product)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <FaExpand />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div
            className="wpants-no-results"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <FaTshirt
              className="wpants-no-icon"
              style={{ fontSize: "48px", color: "#666" }}
            />
            <h3>No pants found</h3>
            <p>Try adjusting your filters</p>
            <button
              onClick={() => {
                setActiveFilter("All");
                setActiveFit("all");
                setVisibleCount(12);
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {hasMore && (
          <div className="wpants-load-more">
            <motion.button
              className="wpants-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
            >
              Load More Pants <FaArrowRight />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="wpants-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="wpants-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="wpants-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>
              <div className="wpants-modal-grid">
                <div className="wpants-modal-img-section">
                  <img src={quickView.image} alt={quickView.title} />
                  {quickView.badge && (
                    <span
                      className="wpants-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                </div>

                <div className="wpants-modal-info">
                  <div className="wpants-modal-brand">
                    <span className="wpants-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>
                  <h2>{quickView.title}</h2>
                  <span className="wpants-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div
                    className="wpants-modal-rating-wrapper"
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

                  <div
                    className="wpants-card-price"
                    style={{ margin: "10px 0" }}
                  >
                    <span className="wpants-price-now">${quickView.price}</span>
                    <span className="wpants-price-was">
                      ${quickView.oldPrice || quickView.price}
                    </span>
                    <span className="wpants-save-tag">
                      -
                      {getDiscount(
                        quickView.oldPrice || quickView.price,
                        quickView.price,
                      )}
                      %
                    </span>
                  </div>

                  <div className="wpants-modal-tabs">
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`wpants-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="wpants-modal-tab-content">
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
                          "Premium quality pants for everyday wear."}
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
                          <strong>Rise:</strong> {quickView.rise || "Mid rise"}
                        </li>
                        <li>
                          <strong>Inseam:</strong>{" "}
                          {quickView.inseam || "30 inches"}
                        </li>
                        <li>
                          <strong>Closure:</strong>{" "}
                          {quickView.closure || "Zipper"}
                        </li>
                        <li>
                          <strong>Occasion:</strong>{" "}
                          {quickView.occasion || "Casual"}
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

                  <div className="wpants-modal-section">
                    <h4>Color</h4>
                    <div className="wpants-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`wpants-modal-color ${modalColor === c ? "selected" : ""}`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wpants-modal-section">
                    <h4>Size</h4>
                    <div className="wpants-modal-sizes">
                      {(quickView.sizes || []).map((s) => (
                        <button
                          key={s}
                          className={`wpants-modal-size ${modalSize === s ? "selected" : ""}`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wpants-modal-section">
                    <h4>Quantity</h4>
                    <div className="wpants-qty">
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

                  <div className="wpants-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="wpants-modal-actions">
                    <motion.button
                      className="wpants-modal-cart-btn"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        handleModalAddToCart();
                        setQuickView(null);
                      }}
                    >
                      <FaShoppingCart /> Add to Cart
                    </motion.button>
                    <motion.button
                      className={`wpants-modal-wish-btn ${
                        isInWishlist(quickView.id) ? "liked" : ""
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

export default WomenPants;
