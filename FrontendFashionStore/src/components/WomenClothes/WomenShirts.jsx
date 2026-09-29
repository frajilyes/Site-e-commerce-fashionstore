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
  FaFemale,
  FaRulerVertical,
  FaTshirt,
} from "react-icons/fa";
import "./WomenShirts.css";

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x1: parseFloat((Math.random() * 100).toFixed(2)),
  x2: parseFloat((Math.random() * 100).toFixed(2)),
  size: parseFloat((2 + Math.random() * 5).toFixed(2)),
  dur: parseFloat((14 + Math.random() * 16).toFixed(2)),
  delay: parseFloat((Math.random() * 8).toFixed(2)),
  opacity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
}));

const subCategories = [
  "All",
  "Blouses",
  "Shirts",
  "Tunics",
  "Crop Tops",
  "Silk Tops",
  "Casual",
  "Office",
  "Evening",
  "T-Shirts",
  "Tank Tops",
];

const shirtSizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

const necklineTypes = [
  "All",
  "V-Neck",
  "Round Neck",
  "Boat Neck",
  "Square Neck",
  "Halter",
  "Off-Shoulder",
  "Cowl",
];

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

const WomenShirts = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();

  const allShirts = products.filter(
    (product) =>
      product.audience === "women" &&
      (product.type === "Shirts" ||
        product.type === "Tops" ||
        product.subCategory?.includes("Blouses") ||
        product.subCategory?.includes("Shirts") ||
        product.subCategory?.includes("Tunics") ||
        product.subCategory?.includes("Crop Tops") ||
        product.subCategory?.includes("Silk Tops") ||
        product.subCategory?.includes("T-Shirts") ||
        product.subCategory?.includes("Tank Tops") ||
        subCategories.includes(product.subCategory)),
  );

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const userRatings = useSelector((state) => state.ratings.userRatings);
  const cartItems = useSelector((state) => state.cart.items);

  const [activeFilter, setActiveFilter] = useState("All");
  const [quickView, setQuickView] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [modalQty, setModalQty] = useState(1);
  const [modalSize, setModalSize] = useState(null);
  const [modalColor, setModalColor] = useState(null);
  const [modalTab, setModalTab] = useState("description");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedNeckline, setSelectedNeckline] = useState("All");
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
      ? [...allShirts]
      : allShirts.filter((p) => p.subCategory === activeFilter);

  if (selectedSize)
    filtered = filtered.filter((p) => p.sizes?.includes(selectedSize));

  if (selectedNeckline !== "All")
    filtered = filtered.filter((p) => p.neckline === selectedNeckline);

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
          category: product.subCategory || "Shirts",
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

  const clearAllFilters = () => {
    setActiveFilter("All");
    setSelectedSize(null);
    setSelectedNeckline("All");
    setVisibleCount(12);
  };

  return (
    <div className="ws-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="ws-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FaHeart
              className={
                wishlistNotif.action === "added"
                  ? "ws-toast-heart-added"
                  : "ws-toast-heart-removed"
              }
            />
            {wishlistNotif.action === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="ws-hero">
        <div className="ws-hero-bg" />
        <div className="ws-hero-overlay" />
        <div className="ws-hero-gradient" />
        <div className="ws-glow wsg1" />
        <div className="ws-glow wsg2" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="ws-particle"
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

        <div className="ws-hero-content">
          <motion.div
            className="ws-breadcrumb"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span>Home</span> / <span>Shop</span> / <span>Women</span> /{" "}
            <span className="ws-bread-active">Shirts & Tops</span>
          </motion.div>

          <motion.div
            className="ws-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <FaTshirt className="ws-tag-icon" />
            <FaFemale className="ws-tag-icon" />
            Women's Shirts Collection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Elegance Redefined,
            <br />
            <span className="ws-neon">Style Perfected</span>
          </motion.h1>

          <motion.p
            className="ws-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            From silk blouses to casual tunics — discover the perfect top
            <br />
            for every moment, every mood, every you.
          </motion.p>

          <motion.div
            className="ws-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="ws-feat">
              <FaTruck /> Free Shipping
            </div>
            <div className="ws-feat">
              <FaShieldAlt /> Premium Quality
            </div>
            <div className="ws-feat">
              <FaUndo /> Easy Returns
            </div>
            <div className="ws-feat">
              <FaRulerVertical /> Size Guide
            </div>
          </motion.div>
        </div>
      </section>

      <section className="ws-filter-bar">
        <div className="ws-filter-row">
          <div className="ws-filter-left">
            <FaFilter className="ws-filter-icon" />
            <div className="ws-chips">
              {subCategories.map((c, i) => (
                <motion.button
                  key={i}
                  className={`ws-chip ${activeFilter === c ? "active" : ""}`}
                  onClick={() => { setActiveFilter(c); setVisibleCount(12); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="ws-filter-right">
            <div className="ws-neckline-filter">
              <span className="ws-neckline-label">Neckline:</span>
              <select
                className="ws-neckline-select"
                value={selectedNeckline}
                onChange={(e) => { setSelectedNeckline(e.target.value); setVisibleCount(12); }}
              >
                {necklineTypes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ws-size-filter">
              <span className="ws-size-label">Size:</span>
              <div className="ws-size-chips">
                {shirtSizes.map((s) => (
                  <button
                    key={s}
                    className={`ws-size-btn ${selectedSize === s ? "active" : ""}`}
                    onClick={() => {
                      setSelectedSize(selectedSize === s ? null : s);
                      setVisibleCount(12);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="ws-sort-wrap">
              <button
                className="ws-sort-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                Sort By <FaChevronDown />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="ws-sort-drop"
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
                        className={`ws-sort-item ${sortBy === s.v ? "active" : ""}`}
                        onClick={() => {
                          setSortBy(s.v);
                          setSortOpen(false);
                          setVisibleCount(12);
                        }}
                      >
                        {s.l} {sortBy === s.v && <FaCheck />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="ws-results-info">
          <span className="ws-count">
            <span>{filtered.length}</span> items found
          </span>
          {activeFilter !== "All" && (
            <span className="ws-active-tag">
              {activeFilter}
              <FaTimes
                className="ws-clear"
                onClick={() => { setActiveFilter("All"); setVisibleCount(12); }}
              />
            </span>
          )}
          {selectedNeckline !== "All" && (
            <span className="ws-active-tag">
              Neckline: {selectedNeckline}
              <FaTimes
                className="ws-clear"
                onClick={() => setSelectedNeckline("All")}
              />
            </span>
          )}
          {selectedSize && (
            <span className="ws-active-tag">
              Size: {selectedSize}
              <FaTimes
                className="ws-clear"
                onClick={() => setSelectedSize(null)}
              />
            </span>
          )}
        </div>
      </section>

      <section className="ws-grid-section">
        <motion.div className="ws-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, i) => (
              <motion.div
                className="ws-card"
                key={product.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                exit="exit"
                viewport={{ once: true }}
                custom={i}
                layout
              >
                <div className="ws-card-img">
                  <img src={product.image} alt={product.title} />
                  {product.badge && (
                    <span
                      className="ws-badge"
                      style={{ background: product.badgeColor }}
                    >
                      {product.badge}
                    </span>
                  )}
                  <span className="ws-discount-tag">
                    -
                    {getDiscount(
                      product.oldPrice || product.price,
                      product.price,
                    )}
                    %
                  </span>

                  <div className="ws-img-tags">
                    <span className="ws-neckline-tag">{product.neckline}</span>
                    <span className="ws-sleeve-tag">{product.sleeve}</span>
                  </div>

                  {!product.inStock && (
                    <div className="ws-sold-out">
                      <span>Sold Out</span>
                    </div>
                  )}

                  <motion.button
                    className={`ws-heart ${isInWishlist(product.id) ? "liked" : ""}`}
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

                <div className="ws-card-body">
                  <div className="ws-card-author">
                    <span className="ws-brand-dot" />
                    {product.author || "Brand"}
                  </div>
                  <h3 className="ws-card-title">{product.title}</h3>
                  <div className="ws-card-tags">
                    <span className="ws-card-cat">
                      {product.subCategory || product.category}
                    </span>
                    <span className="ws-card-fit">{product.fit}</span>
                    <span className="ws-card-neckline">{product.neckline}</span>
                  </div>
                  <p className="ws-card-desc">
                    {product.description?.substring(0, 85) ||
                      "Premium quality shirt"}
                    ...
                  </p>

                  <div className="ws-card-features">
                    {(product.features || []).slice(0, 3).map((f, fi) => (
                      <span key={fi} className="ws-feature-chip">
                        ✓ {f}
                      </span>
                    ))}
                  </div>

                  <div className="kc-card-rating-wrapper">
                    <StarRating
                      currentRating={product.rating || 0}
                      userRating={userRatings[product.id] || null}
                      onRate={(rating) => handleRateProduct(product.id, rating)}
                      readonly={false}
                      showLabel={false}
                      size="small"
                    />
                    <span className="kc-rating-reviews">
                      {product.reviews || 0} reviews
                    </span>
                  </div>

                  <div className="ws-card-colors">
                    {(product.colors || []).map((c, ci) => (
                      <span
                        key={ci}
                        className="ws-color-dot"
                        style={{ background: c }}
                      />
                    ))}
                    <span className="ws-color-label">
                      {(product.colors || []).length} colors
                    </span>
                  </div>

                  <div className="ws-card-sizes">
                    {(product.sizes || []).map((s) => (
                      <span key={s} className="ws-size-mini">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="ws-sold-info">
                    <FaRegClock />
                    <span>
                      {(product.soldCount || 0).toLocaleString()} sold
                    </span>
                  </div>

                  <div className="ws-card-price">
                    <span className="ws-price-now">${product.price}</span>
                    <span className="ws-price-was">
                      ${product.oldPrice || product.price}
                    </span>
                    <span className="ws-save">
                      Save $
                      {(
                        (product.oldPrice || product.price) - product.price
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="ws-card-btns">
                    <motion.button
                      className={`ws-add-btn ${animatingCart === product.id || isInCart(product.id) ? "added" : ""}`}
                      onClick={() => handleAddToCart(product)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!product.inStock}
                    >
                      {animatingCart === product.id || isInCart(product.id) ? (
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
                      className="ws-quick-btn"
                      onClick={() => openQuickView(product)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <FaExpand />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="ws-no-results">
            <FaTshirt className="ws-no-icon" />
            <h3>No items found</h3>
            <p>Try adjusting your filters</p>
            <button onClick={clearAllFilters}>Clear All Filters</button>
          </div>
        )}

        {hasMore && (
          <div className="ws-load-more">
            <motion.button
              className="ws-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
            >
              Load More Items <FaArrowRight />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="ws-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="ws-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="ws-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>
              <div className="ws-modal-grid">
                <div className="ws-modal-img">
                  <img src={quickView.image} alt={quickView.title} />
                  {quickView.badge && (
                    <span
                      className="ws-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  <div className="ws-img-tags ws-tags-modal">
                    <span className="ws-neckline-tag">
                      {quickView.neckline}
                    </span>
                    <span className="ws-sleeve-tag">{quickView.sleeve}</span>
                  </div>
                </div>

                <div className="ws-modal-info">
                  <div className="ws-card-author">
                    <span className="ws-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>
                  <h2>{quickView.title}</h2>
                  <div className="ws-card-tags">
                    <span className="ws-card-cat">
                      {quickView.subCategory || quickView.category}
                    </span>
                    <span className="ws-card-fit">{quickView.fit}</span>
                    <span className="ws-card-neckline">
                      {quickView.neckline}
                    </span>
                    <span className="ws-card-fit">{quickView.sleeve}</span>
                  </div>

                  <div
                    className="ws-modal-rating-wrapper"
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

                  <div className="ws-card-price" style={{ margin: "10px 0" }}>
                    <span className="ws-price-now">${quickView.price}</span>
                    <span className="ws-price-was">
                      ${quickView.oldPrice || quickView.price}
                    </span>
                    <span className="ws-save">
                      -
                      {getDiscount(
                        quickView.oldPrice || quickView.price,
                        quickView.price,
                      )}
                      %
                    </span>
                  </div>

                  <div className="ws-modal-tabs">
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`ws-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="ws-tab-content">
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
                          "Premium quality shirt for everyday wear."}
                      </p>
                    )}
                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "Cotton blend"}
                        </li>
                        <li>
                          <strong>Fit:</strong> {quickView.fit || "Regular"}
                        </li>
                        <li>
                          <strong>Neckline:</strong>{" "}
                          {quickView.neckline || "Round Neck"}
                        </li>
                        <li>
                          <strong>Sleeve:</strong>{" "}
                          {quickView.sleeve || "Short Sleeve"}
                        </li>
                        <li>
                          <strong>Features:</strong>{" "}
                          {(quickView.features || []).join(", ")}
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

                  <div className="ws-modal-section">
                    <h4>Color</h4>
                    <div className="ws-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`ws-modal-color ${modalColor === c ? "selected" : ""}`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="ws-modal-section">
                    <h4>Size</h4>
                    <div className="ws-modal-sizes">
                      {(quickView.sizes || []).map((s) => (
                        <button
                          key={s}
                          className={`ws-modal-size ${modalSize === s ? "selected" : ""}`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ws-modal-section">
                    <h4>Quantity</h4>
                    <div className="ws-qty">
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

                  <div className="ws-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="ws-modal-actions">
                    <motion.button
                      className="ws-modal-cart"
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
                      className={`ws-modal-wish ${
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

export default WomenShirts;
