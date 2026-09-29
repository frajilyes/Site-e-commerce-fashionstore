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
  FaTshirt,
  FaTag,
  FaRulerHorizontal,
  FaFeather,
} from "react-icons/fa";
import "./MenTShirts.css";

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
  "Crew Neck",
  "V-Neck",
  "Polo",
  "Graphic",
  "Henley",
  "Long Sleeve",
  "Tank",
  "Oversized",
  "Slim Fit",
];

const fitTypes = [
  { id: "all", label: "All Fits", icon: null },
  { id: "slim", label: "Slim Fit", icon: FaRulerHorizontal },
  { id: "regular", label: "Regular Fit", icon: FaTshirt },
  { id: "relaxed", label: "Relaxed Fit", icon: FaFeather },
];

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
  if (occasion.includes("Business") || occasion.includes("Smart")) {
    return "#ffd700";
  }
  if (
    occasion.includes("Athletic") ||
    occasion.includes("Gym") ||
    occasion.includes("Training")
  ) {
    return "#ff4444";
  }
  if (occasion.includes("Luxury") || occasion.includes("Premium")) {
    return "#FFD700";
  }
  if (occasion.includes("Eco") || occasion.includes("Sustainable")) {
    return "#2ecc71";
  }
  return "#00ff88";
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

const MenTShirts = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();

  const allTShirts = products.filter(
    (product) => product.audience === "men" && product.category === "T-Shirts",
  );

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const userRatings = useSelector((state) => state.ratings.userRatings);

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeFit, setActiveFit] = useState("all");
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

  const handleRateProduct = (productId, rating) => {
    dispatch(setRating({ productId, rating }));
  };

  let filtered =
    activeFilter === "All"
      ? [...allTShirts]
      : allTShirts.filter((p) => p.subCategory === activeFilter);

  if (activeFit !== "all") {
    filtered = filtered.filter((p) => p.fitType === activeFit);
  }

  if (sortBy === "low") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "high") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "rating")
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sortBy === "popular")
    filtered.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const handleLoadMore = () => setVisibleCount((prev) => prev + 12);

  const toggleWishlist = (product) => {
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
          category: product.subCategory || product.category,
          rating: product.rating,
          reviews: product.reviews,
        }),
      );
      setWishlistNotif({ id: product.id, action: "added" });
    }

    setTimeout(() => setWishlistNotif(null), 2000);
  };

  const handleAddToCart = (product) => {
    if (!product.inStock) return;
    dispatch(
      addToCart({
        id: product.id,
        name: product.title,
        price: product.price,
        image: product.image,
        size: product.sizes?.[0] ?? "M",
        color: product.colors?.[0] ?? "Default",
        quantity: 1,
      }),
    );
    setAddedToCart((p) => [...p, product.id]);
    setTimeout(
      () => setAddedToCart((p) => p.filter((c) => c !== product.id)),
      2000,
    );
  };

  const handleModalAddToCart = () => {
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
        name: quickView.title,
        price: quickView.price,
        image: quickView.image,
        size: modalSize ?? "M",
        color: modalColor ?? "Default",
        quantity: modalQty,
      }),
    );
    setAddedToCart((p) => [...p, quickView.id]);
    setTimeout(
      () => setAddedToCart((p) => p.filter((c) => c !== quickView.id)),
      2000,
    );
    setQuickView(null);
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
    <div className="mts-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="mts-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FaHeart
              className={
                wishlistNotif.action === "added"
                  ? "mts-toast-heart-added"
                  : "mts-toast-heart-removed"
              }
            />
            {wishlistNotif.action === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mts-hero">
        <div className="mts-hero-bg" />
        <div className="mts-hero-overlay" />
        <div className="mts-hero-gradient" />
        <div className="mts-glow g1" />
        <div className="mts-glow g2" />
        <div className="mts-glow g3" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="mts-particle"
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

        <div className="mts-hero-content">
          <motion.div
            className="mts-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="mts-tag-dot" />
            Men's T-Shirts 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Premium Men's
            <br />
            <span className="mts-neon">T-Shirts Collection</span>
          </motion.h1>

          <motion.p
            className="mts-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Discover essential t-shirts for the modern man.
            <br />
            Comfort meets style. Quality meets versatility.
          </motion.p>

          <motion.div
            className="mts-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="mts-feature">
              <FaTshirt /> Premium Fabric
            </div>
            <div className="mts-feature">
              <FaFeather /> Ultra Comfortable
            </div>
            <div className="mts-feature">
              <FaTag /> Perfect Fit
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mts-fit-bar">
        <div className="mts-fit-row">
          {fitTypes.map((f) => (
            <motion.button
              key={f.id}
              className={`mts-fit-chip ${activeFit === f.id ? "active" : ""}`}
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

      <section className="mts-filter-bar">
        <div className="mts-filter-row">
          <div className="mts-filter-left">
            <FaFilter className="mts-filter-icon" />
            <div className="mts-chips">
              {categories.map((c, i) => (
                <motion.button
                  key={i}
                  className={`mts-chip ${activeFilter === c ? "active" : ""}`}
                  onClick={() => { setActiveFilter(c); setVisibleCount(12); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mts-filter-right">
            <div className="mts-sort-wrap">
              <button
                className="mts-sort-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                Sort By <FaChevronDown />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="mts-sort-drop"
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
                        className={`mts-sort-item ${
                          sortBy === s.v ? "active" : ""
                        }`}
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
            <span className="mts-count">
              <span>{filtered.length}</span> t-shirts found
            </span>
          </div>
        </div>
      </section>

      <section className="mts-grid-section">
        <motion.div className="mts-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, i) => {
              const fitBadge = getFitBadge(product.fitType);
              return (
                <motion.div
                  className="mts-card"
                  key={product.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  exit="exit"
                  viewport={{ once: true }}
                  custom={i}
                  layout
                >
                  <div className="mts-card-img">
                    <img src={product.image} alt={product.title} />

                    <span
                      className="mts-fit-badge"
                      style={{
                        background: fitBadge.bg,
                        color: fitBadge.color,
                      }}
                    >
                      {fitBadge.label}
                    </span>

                    {product.badge && (
                      <span
                        className="mts-badge"
                        style={{ background: product.badgeColor }}
                      >
                        {product.badge}
                      </span>
                    )}

                    <span className="mts-discount-tag">
                      -
                      {getDiscount(
                        product.oldPrice || product.price,
                        product.price,
                      )}
                      %
                    </span>

                    {!product.inStock && (
                      <div className="mts-sold-out">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`mts-heart ${
                        isInWishlist(product.id) ? "liked" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
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

                  <div className="mts-card-body">
                    <div className="mts-card-author">
                      <span className="mts-brand-dot" />
                      {product.author || "Brand"}
                    </div>

                    <h3 className="mts-card-title">{product.title}</h3>

                    <span className="mts-card-cat">
                      {product.subCategory || product.category}
                    </span>

                    <div className="mts-occasion">
                      <FaTag className="occasion-icon" />
                      <span
                        style={{ color: getOccasionColor(product.occasion) }}
                      >
                        {product.occasion || "Casual"}
                      </span>
                    </div>

                    <div className="mts-weight-info">
                      <FaFeather />
                      <span>{product.weight || "Standard"}</span>
                    </div>

                    <p className="mts-card-desc">
                      {product.description?.substring(0, 80) ||
                        "Premium quality t-shirt"}
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

                    <div className="mts-card-colors">
                      {(product.colors || []).map((c, ci) => (
                        <span
                          key={ci}
                          className="mts-color-mini"
                          style={{ background: c }}
                        />
                      ))}
                      <span className="mts-color-count">
                        {(product.colors || []).length} colors
                      </span>
                    </div>

                    <div className="mts-features-mini">
                      {(product.features || []).slice(0, 2).map((f, fi) => (
                        <span key={fi} className="mts-feature-tag">
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="mts-sold-info">
                      <FaRegClock />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="mts-card-price">
                      <span className="mts-price-now">${product.price}</span>
                      <span className="mts-price-was">
                        ${product.oldPrice || product.price}
                      </span>
                      <span className="mts-save-tag">
                        Save $
                        {(
                          (product.oldPrice || product.price) - product.price
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="mts-card-btns">
                      <motion.button
                        className={`mts-add-btn ${
                          addedToCart.includes(product.id) ? "added" : ""
                        }`}
                        onClick={() => handleAddToCart(product)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!product.inStock}
                      >
                        {addedToCart.includes(product.id) ? (
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
                        className="mts-view-btn"
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
            className="ms-no-results"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <FaTshirt
              className="ms-no-icon"
              style={{ fontSize: "48px", color: "#666" }}
            />
            <h3>No t-shirts found</h3>
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
          <div className="mts-load-more">
            <motion.button
              className="mts-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
            >
              Load More T-Shirts <FaArrowRight />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="mts-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="mts-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="mts-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>

              <div className="mts-modal-grid">
                <div className="mts-modal-img-section">
                  <img src={quickView.image} alt={quickView.title} />
                  {quickView.badge && (
                    <span
                      className="mts-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  <span
                    className="mts-modal-fit-badge"
                    style={{
                      background: getFitBadge(quickView.fitType).bg,
                      color: getFitBadge(quickView.fitType).color,
                    }}
                  >
                    {getFitBadge(quickView.fitType).label} Fit
                  </span>
                </div>

                <div className="mts-modal-info">
                  <div className="mts-modal-brand">
                    <span className="mts-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>

                  <span className="mts-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div className="mts-modal-fit-info">
                    <div className="mts-fit-detail">
                      <FaTshirt className="fit-icon" />
                      <span>
                        Fit: {getFitBadge(quickView.fitType || "regular").label}
                      </span>
                    </div>
                    <div className="mts-fit-detail">
                      <FaFeather className="fit-icon" />
                      <span>Weight: {quickView.weight || "Standard"}</span>
                    </div>
                    <div className="mts-fit-detail">
                      <FaTag className="fit-icon" />
                      <span>Occasion: {quickView.occasion || "Casual"}</span>
                    </div>
                  </div>

                  <div
                    className="mts-modal-rating-wrapper"
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

                  <div className="mts-card-price" style={{ margin: "10px 0" }}>
                    <span className="mts-price-now">${quickView.price}</span>
                    <span className="mts-price-was">
                      ${quickView.oldPrice || quickView.price}
                    </span>
                    <span className="mts-save-tag">
                      -
                      {getDiscount(
                        quickView.oldPrice || quickView.price,
                        quickView.price,
                      )}
                      %
                    </span>
                  </div>

                  <div className="mts-modal-tabs">
                    {["description", "details", "care", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`mts-tab ${
                          modalTab === tab ? "active" : ""
                        }`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="mts-modal-tab-content">
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
                          "Premium quality t-shirt for everyday wear."}
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
                        <li>
                          <strong>Fit Type:</strong>{" "}
                          {getFitBadge(quickView.fitType || "regular").label}
                        </li>
                        <li>
                          <strong>Weight:</strong>{" "}
                          {quickView.weight || "Standard"}
                        </li>
                        <li>
                          <strong>Care:</strong>{" "}
                          {quickView.care || "Machine wash cold"}
                        </li>
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount || 0).toLocaleString()} units
                        </li>
                      </ul>
                    )}
                    {modalTab === "care" && (
                      <ul>
                        <li>
                          <FaCheck style={{ color: "#00ff88" }} />{" "}
                          {quickView.care || "Machine wash cold"}
                        </li>
                        <li>
                          <FaCheck style={{ color: "#00ff88" }} /> Do not bleach
                        </li>
                        <li>
                          <FaCheck style={{ color: "#00ff88" }} /> Tumble dry
                          low
                        </li>
                        <li>
                          <FaCheck style={{ color: "#00ff88" }} /> Iron low heat
                        </li>
                        <li>
                          <FaTruck /> Free shipping on orders over $50
                        </li>
                        <li>
                          <FaUndo /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt /> Quality guarantee
                        </li>
                      </ul>
                    )}
                  </div>

                  <div className="mts-modal-section">
                    <h4>Color</h4>
                    <div className="mts-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`mts-modal-color ${
                            modalColor === c ? "selected" : ""
                          }`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mts-modal-section">
                    <h4>Size</h4>
                    <div className="mts-modal-sizes">
                      {(quickView.sizes || []).map((s) => (
                        <button
                          key={s}
                          className={`mts-modal-size ${
                            modalSize === s ? "selected" : ""
                          }`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mts-modal-section">
                    <h4>Quantity</h4>
                    <div className="mts-qty">
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

                  <div className="mts-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="mts-modal-actions">
                    <motion.button
                      className="mts-modal-cart-btn"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleModalAddToCart}
                      disabled={!quickView.inStock}
                    >
                      <FaShoppingCart /> Add to Cart
                    </motion.button>

                    <motion.button
                      className={`mts-modal-wish-btn ${
                        isInWishlist(quickView.id) ? "liked" : ""
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleWishlist(quickView)}
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

export default MenTShirts;
