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
  FaRulerHorizontal,
  FaTshirt,
  FaWalking,
  FaVenus,
} from "react-icons/fa";
import "./WomenCroppedPants.css";

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
  "Chino Crop",
  "Denim Crop",
  "Linen Crop",
  "Jogger Crop",
  "Cargo Crop",
  "Tailored Crop",
  "Wide Leg Crop",
  "Culottes",
];

const fitTypes = [
  { id: "all", label: "All Fits", icon: null },
  { id: "slim", label: "Slim Fit", icon: FaTshirt },
  { id: "regular", label: "Regular Fit", icon: FaWalking },
  { id: "wide", label: "Wide Leg", icon: FaRulerHorizontal },
];

const getFitBadge = (fitType) => {
  switch (fitType) {
    case "slim":
      return {
        bg: "rgba(0, 255, 136, 0.12)",
        color: "#00ff88",
        label: "Slim",
      };
    case "regular":
      return {
        bg: "rgba(0, 255, 136, 0.15)",
        color: "#00ff88",
        label: "Regular",
      };
    case "wide":
      return {
        bg: "rgba(0, 191, 255, 0.15)",
        color: "#00bfff",
        label: "Wide",
      };
    default:
      return {
        bg: "rgba(255, 255, 255, 0.1)",
        color: "#ffffff",
        label: "",
      };
  }
};

const getOccasionColor = (occasion) => {
  if (!occasion) return "#00ff88";
  if (
    occasion.includes("Formal") ||
    occasion.includes("Business") ||
    occasion.includes("Office")
  )
    return "#ffd700";
  if (occasion.includes("Athletic") || occasion.includes("Sport"))
    return "#00cc6a";
  if (
    occasion.includes("Beach") ||
    occasion.includes("Resort") ||
    occasion.includes("Summer")
  )
    return "#00bfff";
  if (occasion.includes("Casual") || occasion.includes("Everyday"))
    return "#00ff88";
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

const WomenCroppedPants = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();

  const allCroppedPants = products.filter(
    (product) =>
      product.audience === "women" &&
      (product.type === "Cropped Pants" ||
        product.type === "Pants" ||
        product.subCategory?.includes("Crop") ||
        product.subCategory?.includes("Culottes") ||
        categories.includes(product.subCategory)),
  );

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const userRatings = useSelector((state) => state.ratings.userRatings);
  const cartItems = useSelector((state) => state.cart.items);

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

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);
  const isInCart = (id) => cartItems.some((item) => item.id === id);

  let filtered =
    activeFilter === "All"
      ? [...allCroppedPants]
      : allCroppedPants.filter((p) => p.subCategory === activeFilter);

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
          category: product.subCategory || "Cropped Pants",
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
    setAddedToCart((p) => [...p, product.id]);
    setTimeout(
      () => setAddedToCart((p) => p.filter((c) => c !== product.id)),
      2000,
    );
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
    setAddedToCart((p) => [...p, quickView.id]);
    setTimeout(
      () => setAddedToCart((p) => p.filter((c) => c !== quickView.id)),
      2000,
    );
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
    <div className="wcp-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="wcp-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FaHeart
              className={
                wishlistNotif.action === "added"
                  ? "wcp-toast-heart-added"
                  : "wcp-toast-heart-removed"
              }
            />
            {wishlistNotif.action === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="wcp-hero">
        <div className="wcp-hero-bg" />
        <div className="wcp-hero-overlay" />
        <div className="wcp-hero-gradient" />
        <div className="wcp-glow g1" />
        <div className="wcp-glow g2" />
        <div className="wcp-glow g3" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="wcp-particle"
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

        <div className="wcp-hero-content">
          <motion.div
            className="wcp-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="wcp-tag-dot" />
            Women's Cropped Pants 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Elegant Women's
            <br />
            <span className="wcp-neon">Cropped Pants Collection</span>
          </motion.h1>

          <motion.p
            className="wcp-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Discover contemporary cropped pants for the modern woman.
            <br />
            Style meets comfort. Versatility meets sophistication.
          </motion.p>

          <motion.div
            className="wcp-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="wcp-feature">
              <FaRulerHorizontal /> Perfect Length
            </div>
            <div className="wcp-feature">
              <FaTshirt /> Premium Fabric
            </div>
            <div className="wcp-feature">
              <FaVenus /> Flattering Fit
            </div>
          </motion.div>
        </div>
      </section>

      <section className="wcp-fit-bar">
        <div className="wcp-fit-row">
          {fitTypes.map((f) => (
            <motion.button
              key={f.id}
              className={`wcp-fit-chip ${activeFit === f.id ? "active" : ""}`}
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

      <section className="wcp-filter-bar">
        <div className="wcp-filter-row">
          <div className="wcp-filter-left">
            <FaFilter className="wcp-filter-icon" />
            <div className="wcp-chips">
              {categories.map((c, i) => (
                <motion.button
                  key={i}
                  className={`wcp-chip ${activeFilter === c ? "active" : ""}`}
                  onClick={() => { setActiveFilter(c); setVisibleCount(12); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="wcp-filter-right">
            <div className="wcp-sort-wrap">
              <button
                className="wcp-sort-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                Sort By <FaChevronDown />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="wcp-sort-drop"
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
                        className={`wcp-sort-item ${sortBy === s.v ? "active" : ""}`}
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
            <span className="wcp-count">
              <span>{filtered.length}</span> pants found
            </span>
          </div>
        </div>
      </section>

      <section className="wcp-grid-section">
        <motion.div className="wcp-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, i) => {
              const fitBadge = getFitBadge(product.fitType);
              return (
                <motion.div
                  className="wcp-card"
                  key={product.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  exit="exit"
                  viewport={{ once: true }}
                  custom={i}
                  layout
                >
                  <div className="wcp-card-img">
                    <img src={product.image} alt={product.title} />

                    <span
                      className="wcp-fit-badge"
                      style={{
                        background: fitBadge.bg,
                        color: fitBadge.color,
                      }}
                    >
                      {fitBadge.label}
                    </span>

                    {product.badge && (
                      <span
                        className="wcp-badge"
                        style={{ background: product.badgeColor }}
                      >
                        {product.badge}
                      </span>
                    )}

                    <span className="wcp-discount-tag">
                      -
                      {getDiscount(
                        product.oldPrice || product.price,
                        product.price,
                      )}
                      %
                    </span>

                    {!product.inStock && (
                      <div className="wcp-sold-out">
                        <span>Sold Out</span>
                      </div>
                    )}

                    <motion.button
                      className={`wcp-heart ${isInWishlist(product.id) ? "liked" : ""}`}
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

                  <div className="wcp-card-body">
                    <div className="wcp-card-author">
                      <span className="wcp-brand-dot" />
                      {product.author || "Brand"}
                    </div>

                    <h3 className="wcp-card-title">{product.title}</h3>
                    <span className="wcp-card-cat">
                      {product.subCategory || product.category}
                    </span>

                    <div className="wcp-occasion">
                      <FaWalking className="occasion-icon" />
                      <span
                        style={{ color: getOccasionColor(product.occasion) }}
                      >
                        {product.occasion || "Casual"}
                      </span>
                    </div>

                    <p className="wcp-card-desc">
                      {product.description?.substring(0, 80) ||
                        "Premium quality cropped pants"}
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

                    <div className="wcp-card-colors">
                      {(product.colors || []).map((c, ci) => (
                        <span
                          key={ci}
                          className="wcp-color-mini"
                          style={{ background: c }}
                        />
                      ))}
                      <span className="wcp-color-count">
                        {(product.colors || []).length} colors
                      </span>
                    </div>

                    <div className="wcp-features-mini">
                      {(product.features || []).slice(0, 2).map((f, fi) => (
                        <span key={fi} className="wcp-feature-tag">
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="wcp-inseam-info">
                      <FaRulerHorizontal />
                      <span>Inseam: {product.inseam || "26 inches"}</span>
                    </div>

                    <div className="wcp-sold-info">
                      <FaRegClock />
                      <span>
                        {(product.soldCount || 0).toLocaleString()} sold
                      </span>
                    </div>

                    <div className="wcp-card-price">
                      <span className="wcp-price-now">${product.price}</span>
                      <span className="wcp-price-was">
                        ${product.oldPrice || product.price}
                      </span>
                      <span className="wcp-save-tag">
                        Save $
                        {(
                          (product.oldPrice || product.price) - product.price
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="wcp-card-btns">
                      <motion.button
                        className={`wcp-add-btn ${
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
                        className="wcp-view-btn"
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
          <div className="wcp-no-results">
            <FaTshirt className="wcp-no-icon" />
            <h3>No items found</h3>
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
          <div className="wcp-load-more">
            <motion.button
              className="wcp-load-btn"
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
            className="wcp-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="wcp-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="wcp-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>

              <div className="wcp-modal-grid">
                <div className="wcp-modal-img-section">
                  <img src={quickView.image} alt={quickView.title} />
                  {quickView.badge && (
                    <span
                      className="wcp-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  <span
                    className="wcp-modal-fit-badge"
                    style={{
                      background: getFitBadge(quickView.fitType || "regular")
                        .bg,
                      color: getFitBadge(quickView.fitType || "regular").color,
                    }}
                  >
                    {getFitBadge(quickView.fitType || "regular").label} Fit
                  </span>
                </div>

                <div className="wcp-modal-info">
                  <div className="wcp-modal-brand">
                    <span className="wcp-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>
                  <span className="wcp-card-cat">
                    {quickView.subCategory || quickView.category}
                  </span>

                  <div className="wcp-modal-fit-info">
                    <div className="wcp-fit-detail">
                      <FaTshirt className="fit-icon" />
                      <span>
                        Fit: {getFitBadge(quickView.fitType || "regular").label}
                      </span>
                    </div>
                    <div className="wcp-fit-detail">
                      <FaRulerHorizontal className="fit-icon" />
                      <span>Inseam: {quickView.inseam || "26 inches"}</span>
                    </div>
                    <div className="wcp-fit-detail">
                      <FaWalking className="fit-icon" />
                      <span>Occasion: {quickView.occasion || "Casual"}</span>
                    </div>
                  </div>

                  <div className="wcp-modal-rating-wrapper">
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

                  <div className="wcp-card-price" style={{ margin: "10px 0" }}>
                    <span className="wcp-price-now">${quickView.price}</span>
                    <span className="wcp-price-was">
                      ${quickView.oldPrice || quickView.price}
                    </span>
                    <span className="wcp-save-tag">
                      -
                      {getDiscount(
                        quickView.oldPrice || quickView.price,
                        quickView.price,
                      )}
                      %
                    </span>
                  </div>

                  <div className="wcp-modal-tabs">
                    {["description", "details", "sizing", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`wcp-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="wcp-modal-tab-content">
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
                          "Premium quality cropped pants for everyday elegance."}
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
                          <strong>Inseam:</strong>{" "}
                          {quickView.inseam || "26 inches"}
                        </li>
                        <li>
                          <strong>Rise:</strong> {quickView.rise || "Mid rise"}
                        </li>
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount || 0).toLocaleString()} units
                        </li>
                      </ul>
                    )}
                    {modalTab === "sizing" && (
                      <ul>
                        <li>
                          <FaCheck /> True to size fit
                        </li>
                        <li>
                          <FaCheck /> Ankle-length cut
                        </li>
                        <li>
                          <FaCheck /> Comfortable waistband
                        </li>
                        <li>
                          <FaCheck /> Machine washable
                        </li>
                        <li>
                          <FaTruck /> Free shipping on orders over $75
                        </li>
                        <li>
                          <FaUndo /> 30-day return policy
                        </li>
                        <li>
                          <FaShieldAlt /> 1-year quality guarantee
                        </li>
                      </ul>
                    )}
                  </div>

                  <div className="wcp-modal-section">
                    <h4>Color</h4>
                    <div className="wcp-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`wcp-modal-color ${modalColor === c ? "selected" : ""}`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wcp-modal-section">
                    <h4>Size</h4>
                    <div className="wcp-modal-sizes">
                      {(quickView.sizes || []).map((s) => (
                        <button
                          key={s}
                          className={`wcp-modal-size ${modalSize === s ? "selected" : ""}`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wcp-modal-section">
                    <h4>Quantity</h4>
                    <div className="wcp-qty">
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

                  <div className="wcp-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="wcp-modal-actions">
                    <motion.button
                      className="wcp-modal-cart-btn"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleModalAddToCart}
                    >
                      <FaShoppingCart /> Add to Cart
                    </motion.button>

                    <motion.button
                      className={`wcp-modal-wish-btn ${isInWishlist(quickView.id) ? "liked" : ""}`}
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

export default WomenCroppedPants;
