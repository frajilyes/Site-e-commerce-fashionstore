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
  FaSun,
  FaGlasses,
  FaLayerGroup,
  FaGem,
  FaFeather,
} from "react-icons/fa";
import "./WomenGlasses.css";

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
  "Cat Eye",
  "Oversized",
  "Round",
  "Square",
  "Aviator",
  "Butterfly",
  "Wayfarer",
  "Clubmaster",
  "Rimless",
];

const getUVBadge = (uv) => {
  switch (uv) {
    case "UV400":
      return {
        bg: "rgba(0, 255, 136, 0.15)",
        color: "#00ff88",
        label: "UV400",
      };
    case "UV380":
      return {
        bg: "rgba(0, 191, 255, 0.15)",
        color: "#00bfff",
        label: "UV380",
      };
    default:
      return { bg: "rgba(255, 255, 255, 0.1)", color: "#ffffff", label: "UV" };
  }
};

const getLensIcon = (lensType) => {
  if (!lensType) return <FaGlasses className="lens-icon" />;
  if (lensType.toLowerCase().includes("polarized")) {
    return <FaLayerGroup className="lens-icon" />;
  }
  if (lensType.toLowerCase().includes("mirrored")) {
    return <FaSun className="lens-icon" />;
  }
  if (lensType.toLowerCase().includes("gradient")) {
    return <FaGem className="lens-icon" />;
  }
  return <FaGlasses className="lens-icon" />;
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

const WomenGlasses = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();

  const allGlasses = products.filter(
    (product) =>
      product.audience === "women" &&
      (product.type === "Glasses" ||
        product.type === "Sunglasses" ||
        product.subCategory?.includes("Glasses") ||
        product.subCategory?.includes("Sunglasses") ||
        categories.includes(product.subCategory)),
  );

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const userRatings = useSelector((state) => state.ratings.userRatings);
  const cartItems = useSelector((state) => state.cart.items);

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

  const handleRateProduct = (productId, rating) => {
    dispatch(setRating({ productId, rating }));
  };

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);
  const isInCart = (id) => cartItems.some((item) => item.id === id);

  let filtered =
    activeFilter === "All"
      ? [...allGlasses]
      : allGlasses.filter((p) => p.subCategory === activeFilter);

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
          category: product.subCategory || "Sunglasses",
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
        size: product.sizes?.[0] || "Standard",
        color: product.colors?.[0] || "Default",
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
    if (quickView) {
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

      setAddedToCart((p) => [...p, quickView.id]);
      setTimeout(
        () => setAddedToCart((p) => p.filter((c) => c !== quickView.id)),
        2000,
      );
    }
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
    <div className="wg-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="wg-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FaHeart
              className={
                wishlistNotif.action === "added"
                  ? "wg-toast-heart-added"
                  : "wg-toast-heart-removed"
              }
            />
            {wishlistNotif.action === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="wg-hero">
        <div className="wg-hero-bg" />
        <div className="wg-hero-overlay" />
        <div className="wg-hero-gradient" />
        <div className="wg-glow g1" />
        <div className="wg-glow g2" />
        <div className="wg-glow g3" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="wg-particle"
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

        <div className="wg-hero-content">
          <motion.div
            className="wg-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="wg-tag-dot" />
            Women's Sunglasses 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Elegant Women's
            <br />
            <span className="wg-neon">Sunglasses Collection</span>
          </motion.h1>

          <motion.p
            className="wg-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Discover luxury eyewear designed for the modern woman.
            <br />
            Protect your eyes. Express your style.
          </motion.p>

          <motion.div
            className="wg-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="wg-feature">
              <FaSun /> UV400 Protection
            </div>
            <div className="wg-feature">
              <FaGlasses /> Premium Lenses
            </div>
            <div className="wg-feature">
              <FaFeather /> Lightweight Design
            </div>
          </motion.div>
        </div>
      </section>

      <section className="wg-filter-bar">
        <div className="wg-filter-row">
          <div className="wg-filter-left">
            <FaFilter className="wg-filter-icon" />
            <div className="wg-chips">
              {categories.map((c, i) => (
                <motion.button
                  key={i}
                  className={`wg-chip ${activeFilter === c ? "active" : ""}`}
                  onClick={() => { setActiveFilter(c); setVisibleCount(12); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="wg-filter-right">
            <div className="wg-sort-wrap">
              <button
                className="wg-sort-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                Sort By <FaChevronDown />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="wg-sort-drop"
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
                        className={`wg-sort-item ${sortBy === s.v ? "active" : ""}`}
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
            <span className="wg-count">
              <span>{filtered.length}</span> sunglasses found
            </span>
          </div>
        </div>
      </section>

      <section className="wg-grid-section">
        <motion.div className="wg-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, i) => {
              const uvBadge = getUVBadge(product.uvProtection);
              return (
                <motion.div
                  className="wg-card"
                  key={product.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  exit="exit"
                  viewport={{ once: true }}
                  custom={i}
                  layout
                >
                  <div className="wg-card-img">
                    <img src={product.image} alt={product.title} />

                    <span
                      className="wg-uv-badge"
                      style={{ background: uvBadge.bg, color: uvBadge.color }}
                    >
                      {getLensIcon(product.lensType)}
                      {uvBadge.label}
                    </span>

                    {product.badge && (
                      <span
                        className="wg-badge"
                        style={{ background: product.badgeColor }}
                      >
                        {product.badge}
                      </span>
                    )}

                    <span className="wg-discount-tag">
                      -
                      {getDiscount(
                        product.oldPrice || product.price,
                        product.price,
                      )}
                      %
                    </span>

                    {!product.inStock && (
                      <div className="wg-sold-out">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`wg-heart ${isInWishlist(product.id) ? "liked" : ""}`}
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

                  <div className="wg-card-body">
                    <div className="wg-card-author">
                      <span className="wg-brand-dot" />
                      {product.author || "Brand"}
                    </div>

                    <h3 className="wg-card-title">{product.title}</h3>
                    <span className="wg-card-cat">
                      {product.subCategory || product.category}
                    </span>

                    <div className="wg-lens-type">
                      {getLensIcon(product.lensType)}
                      <span>{product.lensType || "Standard"}</span>
                    </div>

                    <p className="wg-card-desc">
                      {product.description?.substring(0, 80) ||
                        "Premium quality sunglasses"}
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

                    <div className="wg-card-colors">
                      {(product.colors || []).map((c, ci) => (
                        <span
                          key={ci}
                          className="wg-color-mini"
                          style={{ background: c }}
                        />
                      ))}
                      <span className="wg-color-count">
                        {(product.colors || []).length} colors
                      </span>
                    </div>

                    <div className="wg-features-mini">
                      {(product.features || []).slice(0, 2).map((f, fi) => (
                        <span key={fi} className="wg-feature-tag">
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="wg-sold-info">
                      <FaRegClock />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="wg-card-price">
                      <span className="wg-price-now">${product.price}</span>
                      <span className="wg-price-was">
                        ${product.oldPrice || product.price}
                      </span>
                      <span className="wg-save-tag">
                        Save $
                        {(
                          (product.oldPrice || product.price) - product.price
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="wg-card-btns">
                      <motion.button
                        className={`wg-add-btn ${
                          addedToCart.includes(product.id) ||
                          isInCart(product.id)
                            ? "added"
                            : ""
                        }`}
                        onClick={() => handleAddToCart(product)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!product.inStock}
                      >
                        {addedToCart.includes(product.id) ||
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
                        className="wg-view-btn"
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
            className="wg-no-results"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <FaGlasses
              className="wg-no-icon"
              style={{ fontSize: "48px", color: "#666" }}
            />
            <h3>No sunglasses found</h3>
            <p>Try adjusting your filters</p>
            <button onClick={() => { setActiveFilter("All"); setVisibleCount(12); }}>Clear Filter</button>
          </div>
        )}

        {hasMore && (
          <div className="wg-load-more">
            <motion.button
              className="wg-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
            >
              Load More Sunglasses <FaArrowRight />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="wg-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="wg-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="wg-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>

              <div className="wg-modal-grid">
                <div className="wg-modal-img-section">
                  <img src={quickView.image} alt={quickView.title} />
                  {quickView.badge && (
                    <span
                      className="wg-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  <span
                    className="wg-modal-uv-badge"
                    style={{
                      background: getUVBadge(quickView.uvProtection || "UV400")
                        .bg,
                      color: getUVBadge(quickView.uvProtection || "UV400")
                        .color,
                    }}
                  >
                    {getLensIcon(quickView.lensType)}
                    {getUVBadge(quickView.uvProtection || "UV400").label}{" "}
                    Protection
                  </span>
                </div>

                <div className="wg-modal-info">
                  <div className="wg-modal-brand">
                    <span className="wg-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>
                  <span className="wg-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div className="wg-modal-lens-info">
                    <div className="wg-lens-detail">
                      <FaSun className="lens-icon" />
                      <span>Lens: {quickView.lensType || "Standard"}</span>
                    </div>
                    <div className="wg-lens-detail">
                      <FaShieldAlt className="lens-icon" />
                      <span>UV: {quickView.uvProtection || "UV400"}</span>
                    </div>
                  </div>

                  <div
                    className="wg-modal-rating-wrapper"
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

                  <div className="wg-card-price" style={{ margin: "10px 0" }}>
                    <span className="wg-price-now">${quickView.price}</span>
                    <span className="wg-price-was">
                      ${quickView.oldPrice || quickView.price}
                    </span>
                    <span className="wg-save-tag">
                      -
                      {getDiscount(
                        quickView.oldPrice || quickView.price,
                        quickView.price,
                      )}
                      %
                    </span>
                  </div>

                  <div className="wg-modal-tabs">
                    {["description", "details", "features", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`wg-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="wg-modal-tab-content">
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
                          "Premium quality sunglasses with UV protection."}
                      </p>
                    )}
                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "Acetate"}
                        </li>
                        <li>
                          <strong>Category:</strong>{" "}
                          {quickView.subCategory || quickView.category}
                        </li>
                        <li>
                          <strong>Brand:</strong> {quickView.author || "Brand"}
                        </li>
                        <li>
                          <strong>Lens Type:</strong>{" "}
                          {quickView.lensType || "Standard"}
                        </li>
                        <li>
                          <strong>UV Protection:</strong>{" "}
                          {quickView.uvProtection || "UV400"}
                        </li>
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount || 0).toLocaleString()} units
                        </li>
                      </ul>
                    )}
                    {modalTab === "features" && (
                      <ul>
                        {(quickView.features || []).map((f, fi) => (
                          <li key={fi}>
                            <FaCheck style={{ color: "#00ff88" }} /> {f}
                          </li>
                        ))}
                        <li>
                          <FaTruck /> Free shipping on orders over $100
                        </li>
                        <li>
                          <FaUndo /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt /> 2-year warranty on frames
                        </li>
                      </ul>
                    )}
                  </div>

                  <div className="wg-modal-section">
                    <h4>Frame Color</h4>
                    <div className="wg-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`wg-modal-color ${modalColor === c ? "selected" : ""}`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wg-modal-section">
                    <h4>Size</h4>
                    <div className="wg-modal-sizes">
                      {(quickView.sizes || ["Standard"]).map((s) => (
                        <button
                          key={s}
                          className={`wg-modal-size ${modalSize === s ? "selected" : ""}`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wg-modal-section">
                    <h4>Quantity</h4>
                    <div className="wg-qty">
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

                  <div className="wg-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="wg-modal-actions">
                    <motion.button
                      className="wg-modal-cart-btn"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleModalAddToCart}
                    >
                      <FaShoppingCart /> Add to Cart
                    </motion.button>
                    <motion.button
                      className={`wg-modal-wish-btn ${
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

export default WomenGlasses;
