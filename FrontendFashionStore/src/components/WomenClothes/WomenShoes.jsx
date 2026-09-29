import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FaShoePrints,
  FaFemale,
} from "react-icons/fa";
import "./WomenShoes.css";

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
  "Heels",
  "Sneakers",
  "Running",
  "Boots",
  "Flats",
  "Sandals",
  "Loafers",
  "Wedges",
  "Luxury",
  "Athletic",
  "Pumps",
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

const WomenShoes = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();

  const allShoes = products.filter(
    (product) =>
      product.audience === "women" &&
      (product.type === "Shoes" ||
        product.type === "Footwear" ||
        product.subCategory?.includes("Heels") ||
        product.subCategory?.includes("Sneakers") ||
        product.subCategory?.includes("Running") ||
        product.subCategory?.includes("Boots") ||
        product.subCategory?.includes("Flats") ||
        product.subCategory?.includes("Sandals") ||
        product.subCategory?.includes("Loafers") ||
        product.subCategory?.includes("Wedges") ||
        product.subCategory?.includes("Luxury") ||
        categories.includes(product.subCategory)),
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
      ? [...allShoes]
      : allShoes.filter((p) => p.subCategory === activeFilter);

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
          category: product.subCategory || "Shoes",
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
        size: product.sizes?.[0] || "7",
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
    <div className="wshoe-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="wshoe-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FaHeart
              className={
                wishlistNotif.action === "added"
                  ? "wshoe-toast-heart-added"
                  : "wshoe-toast-heart-removed"
              }
            />
            {wishlistNotif.action === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="wshoe-hero">
        <div className="wshoe-hero-bg" />
        <div className="wshoe-hero-overlay" />
        <div className="wshoe-hero-gradient" />
        <div className="wshoe-glow wsg1" />
        <div className="wshoe-glow wsg2" />
        <div className="wshoe-glow wsg3" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="wshoe-particle"
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

        <div className="wshoe-hero-content">
          <motion.div
            className="wshoe-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <FaShoePrints className="wshoe-tag-icon" />
            <FaFemale className="wshoe-tag-icon" />
            Women's Shoes Collection 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Step Into
            <br />
            <span className="wshoe-neon">Pure Elegance</span>
          </motion.h1>

          <motion.p
            className="wshoe-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Discover heels, sneakers, boots and sandals made to elevate every
            outfit.
            <br />
            Walk with confidence. Shine with every step.
          </motion.p>

          <motion.div
            className="wshoe-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="wshoe-feat">
              <FaTruck /> Free Shipping
            </div>
            <div className="wshoe-feat">
              <FaShieldAlt /> Authentic Brands
            </div>
            <div className="wshoe-feat">
              <FaUndo /> 30-Day Returns
            </div>
          </motion.div>
        </div>
      </section>

      <section className="wshoe-filter-bar">
        <div className="wshoe-filter-row">
          <div className="wshoe-filter-left">
            <FaFilter className="wshoe-filter-icon" />
            <div className="wshoe-chips">
              {categories.map((c, i) => (
                <motion.button
                  key={i}
                  className={`wshoe-chip ${activeFilter === c ? "active" : ""}`}
                  onClick={() => { setActiveFilter(c); setVisibleCount(12); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="wshoe-filter-right">
            <div className="wshoe-sort-wrap">
              <button
                className="wshoe-sort-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                Sort By <FaChevronDown />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="wshoe-sort-drop"
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
                        className={`wshoe-sort-item ${
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

            <span className="wshoe-count">
              <span>{filtered.length}</span> shoes found
            </span>
          </div>
        </div>
      </section>

      <section className="wshoe-grid-section">
        <motion.div className="wshoe-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, i) => (
              <motion.div
                className="wshoe-card"
                key={product.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                exit="exit"
                viewport={{ once: true }}
                custom={i}
                layout
              >
                <div className="wshoe-card-img">
                  <img src={product.image} alt={product.title} />

                  {product.badge && (
                    <span
                      className="wshoe-badge"
                      style={{ background: product.badgeColor }}
                    >
                      {product.badge}
                    </span>
                  )}

                  <span className="wshoe-discount-tag">
                    -
                    {getDiscount(
                      product.oldPrice || product.price,
                      product.price,
                    )}
                    %
                  </span>

                  <div className="wshoe-img-tags">
                    <span className="wshoe-type-tag">{product.type}</span>
                    <span className="wshoe-closure-tag">{product.closure}</span>
                  </div>

                  {!product.inStock && (
                    <div className="wshoe-sold-out">
                      <span>Sold Out</span>
                    </div>
                  )}

                  <motion.button
                    className={`wshoe-heart ${isInWishlist(product.id) ? "liked" : ""}`}
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

                <div className="wshoe-card-body">
                  <div className="wshoe-card-author">
                    <span className="wshoe-brand-dot" />
                    {product.author || "Brand"}
                  </div>

                  <h3 className="wshoe-card-title">{product.title}</h3>

                  <div className="wshoe-card-tags">
                    <span className="wshoe-card-cat">
                      {product.subCategory || product.category}
                    </span>
                    <span className="wshoe-card-type">{product.type}</span>
                    <span className="wshoe-card-fit">{product.heelHeight}</span>
                  </div>

                  <p className="wshoe-card-desc">
                    {product.description?.substring(0, 85) ||
                      "Premium quality shoes"}
                    ...
                  </p>

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

                  <div className="wshoe-card-colors">
                    {(product.colors || []).map((c, ci) => (
                      <span
                        key={ci}
                        className="wshoe-color-dot"
                        style={{ background: c }}
                      />
                    ))}
                    <span className="wshoe-color-label">
                      {(product.colors || []).length} colors
                    </span>
                  </div>

                  <div className="wshoe-card-sizes">
                    {(product.sizes || []).map((s) => (
                      <span key={s} className="wshoe-size-mini">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="wshoe-sold-info">
                    <FaRegClock />
                    <span>
                      {(product.soldCount || 0).toLocaleString()} sold
                    </span>
                  </div>

                  <div className="wshoe-card-price">
                    <span className="wshoe-price-now">${product.price}</span>
                    <span className="wshoe-price-was">
                      ${product.oldPrice || product.price}
                    </span>
                    <span className="wshoe-save">
                      Save $
                      {(
                        (product.oldPrice || product.price) - product.price
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="wshoe-card-btns">
                    <motion.button
                      className={`wshoe-add-btn ${
                        animatingCart === product.id || isInCart(product.id)
                          ? "added"
                          : ""
                      }`}
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
                      className="wshoe-quick-btn"
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
          <div
            className="wshoe-no-results"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <FaShoePrints
              className="wshoe-no-icon"
              style={{ fontSize: "48px", color: "#666" }}
            />
            <h3>No shoes found</h3>
            <p>Try adjusting your filters</p>
            <button onClick={() => { setActiveFilter("All"); setVisibleCount(12); }}>
              Clear All Filters
            </button>
          </div>
        )}

        {hasMore && (
          <div className="wshoe-load-more">
            <motion.button
              className="wshoe-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
            >
              Load More Shoes <FaArrowRight />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="wshoe-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="wshoe-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="wshoe-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>

              <div className="wshoe-modal-grid">
                <div className="wshoe-modal-img">
                  <img src={quickView.image} alt={quickView.title} />
                  {quickView.badge && (
                    <span
                      className="wshoe-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                </div>

                <div className="wshoe-modal-info">
                  <div className="wshoe-card-author">
                    <span className="wshoe-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>

                  <div className="wshoe-card-tags">
                    <span className="wshoe-card-cat">
                      {quickView.subCategory || quickView.category}
                    </span>
                    <span className="wshoe-card-type">{quickView.type}</span>
                    <span className="wshoe-card-fit">
                      {quickView.heelHeight}
                    </span>
                  </div>

                  <div
                    className="wshoe-modal-rating-wrapper"
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
                    className="wshoe-card-price"
                    style={{ margin: "10px 0" }}
                  >
                    <span className="wshoe-price-now">${quickView.price}</span>
                    <span className="wshoe-price-was">
                      ${quickView.oldPrice || quickView.price}
                    </span>
                    <span className="wshoe-save">
                      -
                      {getDiscount(
                        quickView.oldPrice || quickView.price,
                        quickView.price,
                      )}
                      %
                    </span>
                  </div>

                  <div className="wshoe-modal-tabs">
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`wshoe-tab ${
                          modalTab === tab ? "active" : ""
                        }`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="wshoe-tab-content">
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
                          "Premium quality shoes for everyday wear."}
                      </p>
                    )}

                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "Leather"}
                        </li>
                        <li>
                          <strong>Category:</strong>{" "}
                          {quickView.subCategory || quickView.category}
                        </li>
                        <li>
                          <strong>Type:</strong> {quickView.type || "Casual"}
                        </li>
                        <li>
                          <strong>Heel Height:</strong>{" "}
                          {quickView.heelHeight || "Flat"}
                        </li>
                        <li>
                          <strong>Closure:</strong>{" "}
                          {quickView.closure || "Lace-up"}
                        </li>
                        <li>
                          <strong>Brand:</strong> {quickView.author || "Brand"}
                        </li>
                        <li>
                          <strong>Sold:</strong>{" "}
                          {(quickView.soldCount || 0).toLocaleString()} pairs
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
                          <FaShieldAlt /> Authenticity guaranteed
                        </li>
                      </ul>
                    )}
                  </div>

                  <div className="wshoe-modal-section">
                    <h4>Color</h4>
                    <div className="wshoe-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`wshoe-modal-color ${
                            modalColor === c ? "selected" : ""
                          }`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wshoe-modal-section">
                    <h4>Size</h4>
                    <div className="wshoe-modal-sizes">
                      {(quickView.sizes || []).map((s) => (
                        <button
                          key={s}
                          className={`wshoe-modal-size ${
                            modalSize === s ? "selected" : ""
                          }`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wshoe-modal-section">
                    <h4>Quantity</h4>
                    <div className="wshoe-qty">
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

                  <div className="wshoe-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="wshoe-modal-actions">
                    <motion.button
                      className="wshoe-modal-cart"
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
                      className={`wshoe-modal-wish ${
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

export default WomenShoes;
