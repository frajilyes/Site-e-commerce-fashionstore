import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  clearWishlist,
  removeFromWishlist,
} from "../../components/WishList/wishlistSlice";
import { addToCart } from "../../pages/Checkout/cartSlice";
import { setRating } from "../../components/Rating/ratingsSlice";
import StarRating from "../Rating/StarRating";
import ProductReviews from "../Rating/ProductReviews";
import {
  FaHeart,
  FaShoppingCart,
  FaTrash,
  FaShareAlt,
  FaMinus,
  FaPlus,
  FaCheck,
  FaTimes,
  FaShoppingBag,
  FaArrowRight,
  FaRegClock,
  FaExpand,
  FaTruck,
  FaShieldAlt,
  FaUndo,
  FaChevronDown,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x1: parseFloat((Math.random() * 100).toFixed(2)),
  x2: parseFloat((Math.random() * 100).toFixed(2)),
  size: parseFloat((2 + Math.random() * 5).toFixed(2)),
  dur: parseFloat((14 + Math.random() * 16).toFixed(2)),
  delay: parseFloat((Math.random() * 8).toFixed(2)),
  opacity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
}));

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    x: -100,
    transition: { duration: 0.3 },
  },
};

const modalVariants = {
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
};

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const userRatings = useSelector((state) => state?.ratings?.userRatings || {});

  const [addedToCart, setAddedToCart] = useState([]);
  const [quickView, setQuickView] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalSize, setModalSize] = useState(null);
  const [modalColor, setModalColor] = useState(null);
  const [modalTab, setModalTab] = useState("description");
  const [sortBy, setSortBy] = useState("date");
  const [sortOpen, setSortOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalPrice = wishlistItems.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );

  const getDiscount = (oldPrice, newPrice) => {
    if (!oldPrice || !newPrice || oldPrice <= newPrice) return 0;
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  };

  const sortedItems = [...wishlistItems].sort((a, b) => {
    if (sortBy === "date")
      return new Date(b.addedDate || 0) - new Date(a.addedDate || 0);
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") {
      const ratingA = userRatings[a.id] ?? a.rating ?? 0;
      const ratingB = userRatings[b.id] ?? b.rating ?? 0;
      return ratingB - ratingA;
    }
    return 0;
  });

  const handleRateProduct = (productId, rating) => {
    dispatch(setRating({ productId, rating }));
  };

  const handleAddToCartVisual = (id) => {
    setAddedToCart((prev) => [...prev, id]);
    setTimeout(
      () => setAddedToCart((prev) => prev.filter((itemId) => itemId !== id)),
      2000
    );
  };

  const handleAddToCart = (item) => {
    dispatch(
      addToCart({
        id: item.id,
        _id: item._id ?? null,
        name: item.title || item.name,
        price: item.price,
        image: item.image,
        size: item.sizes?.[0] || "One Size",
        color: item.colors?.[0] || "Default",
        quantity: 1,
      })
    );
    handleAddToCartVisual(item.id);

    dispatch(removeFromWishlist(item.id));
  };

  const handleModalAddToCart = () => {
    if (!quickView) return;

    dispatch(
      addToCart({
        id: quickView.id,
        _id: quickView._id ?? null,
        name: quickView.title || quickView.name,
        price: quickView.price,
        image: quickView.image,
        size: modalSize || quickView.sizes?.[0] || "One Size",
        color: modalColor || quickView.colors?.[0] || "Default",
        quantity: modalQty,
      })
    );
    handleAddToCartVisual(quickView.id);

    dispatch(removeFromWishlist(quickView.id));

    setQuickView(null);
  };

  const handleAddAllToCart = () => {
    wishlistItems.forEach((item) => {
      dispatch(
        addToCart({
          id: item.id,
          _id: item._id ?? null,
          name: item.title || item.name,
          price: item.price,
          image: item.image,
          size: item.sizes?.[0] || "One Size",
          color: item.colors?.[0] || "Default",
          quantity: 1,
        })
      );
      handleAddToCartVisual(item.id);
    });

    dispatch(clearWishlist());
  };

  const handleShare = () => {
    const wishlistText = wishlistItems
      .map((item) => `${item.title || item.name} - $${item.price}`)
      .join("\n");
    const message = `Check out my wishlist!\n\n${wishlistText}\n\nTotal Value: $${totalPrice.toFixed(2)}`;

    if (navigator.share) {
      navigator.share({ title: "My Wishlist", text: message });
    } else {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openQuickView = (product) => {
    setQuickView(product);
    setModalQty(1);
    setModalSize(product.sizes?.[0] || "One Size");
    setModalColor(product.colors?.[0] || "Default");
    setModalTab("description");
  };

  return (
    <div className="wishlist-page">
      <section className="wishlist-hero">
        <div className="wishlist-hero-bg" />
        <div className="wishlist-hero-overlay" />
        <div className="wishlist-hero-gradient" />
        <div className="wishlist-glow g1" />
        <div className="wishlist-glow g2" />
        <div className="wishlist-glow g3" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="wishlist-particle"
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

        <div className="wishlist-hero-content">
          <motion.div
            className="wishlist-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="wishlist-tag-dot" /> My Wishlist
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Your Saved
            <br />
            <span className="wishlist-neon">Favorite Items</span>
          </motion.h1>

          <motion.p
            className="wishlist-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Keep track of your favorite products and purchase them later.
            <br />
            Your personal collection of style inspiration.
          </motion.p>

          <motion.div
            className="wishlist-hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="wishlist-stat">
              <FaHeart className="stat-icon" />
              <span className="stat-number">{wishlistItems.length}</span>
              <span className="stat-label">Items</span>
            </div>
            <div className="wishlist-stat">
              <FaShoppingBag className="stat-icon" />
              <span className="stat-number">${totalPrice.toFixed(2)}</span>
              <span className="stat-label">Total Value</span>
            </div>
            <div className="wishlist-stat">
              <FaCheck className="stat-icon" />
              <span className="stat-number">{wishlistItems.length}</span>
              <span className="stat-label">Saved</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="wishlist-actions-bar">
        <div className="wishlist-actions-container">
          <div className="wishlist-actions-left">
            <motion.button
              className="wishlist-action-btn primary"
              onClick={handleAddAllToCart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={wishlistItems.length === 0}
            >
              <FaShoppingCart /> Add All to Cart
            </motion.button>

            <motion.button
              className="wishlist-action-btn secondary"
              onClick={() => dispatch(clearWishlist())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={wishlistItems.length === 0}
            >
              <FaTrash /> Clear All
            </motion.button>

            <motion.button
              className="wishlist-action-btn secondary"
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={wishlistItems.length === 0}
            >
              {copied ? (
                <>
                  <FaCheck /> Copied!
                </>
              ) : (
                <>
                  <FaShareAlt /> Share
                </>
              )}
            </motion.button>
          </div>

          <div className="wishlist-actions-right">
            <div className="wishlist-sort-wrap">
              <button
                className="wishlist-sort-btn"
                onClick={() => setSortOpen((prev) => !prev)}
              >
                Sort By <FaChevronDown />
                <span>
                  {sortBy === "date"
                    ? "Date Added"
                    : sortBy === "price-low"
                    ? "Price: Low → High"
                    : sortBy === "price-high"
                    ? "Price: High → Low"
                    : "Rating"}
                </span>
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="wishlist-sort-drop"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {[
                      { v: "date", l: "Date Added" },
                      { v: "price-low", l: "Price: Low → High" },
                      { v: "price-high", l: "Price: High → Low" },
                      { v: "rating", l: "Best Rating" },
                    ].map((s) => (
                      <div
                        key={s.v}
                        className={`wishlist-sort-item ${
                          sortBy === s.v ? "active" : ""
                        }`}
                        onClick={() => {
                          setSortBy(s.v);
                          setSortOpen(false);
                        }}
                      >
                        {s.l} {sortBy === s.v && <FaCheck />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="wishlist-count">
              <span>{wishlistItems.length}</span> items
            </span>
          </div>
        </div>
      </section>

      <section className="wc-grid-section">
        <div className="wishlist-items-container">
          {wishlistItems.length === 0 ? (
            <motion.div
              className="wishlist-empty"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FaHeart className="wishlist-empty-icon" />
              <h2>Your Wishlist is Empty</h2>
              <p>Start adding products you love to your wishlist!</p>
              <motion.button
                className="wishlist-empty-btn"
                onClick={() => navigate("/shoplanding")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Products <FaArrowRight />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div className="wc-grid" layout>
              <AnimatePresence mode="popLayout">
                {sortedItems.map((item, i) => {
                  const currentProductRating = userRatings[item.id] ?? null;
                  const discount = getDiscount(item.oldPrice, item.price);

                  return (
                    <motion.div
                      key={item.id}
                      className="wc-card"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={i}
                      layout
                    >
                      <div className="wc-card-img">
                        <img src={item.image} alt={item.title || item.name} />

                        {item.badge && (
                          <span
                            className="wc-badge"
                            style={{ background: item.badgeColor }}
                          >
                            {item.badge}
                          </span>
                        )}

                        {discount > 0 && (
                          <span className="wc-discount-tag">-{discount}%</span>
                        )}

                        {(item.collar || item.sleeve) && (
                          <div className="wc-img-tags">
                            {item.collar && (
                              <span className="wc-collar-tag">
                                {item.collar}
                              </span>
                            )}
                            {item.sleeve && (
                              <span className="wc-sleeve-tag">
                                {item.sleeve}
                              </span>
                            )}
                          </div>
                        )}

                        {item.inStock === false && (
                          <div className="wc-sold-out">
                            <span>Sold Out</span>
                          </div>
                        )}
                      </div>

                      <div className="wc-card-body">
                        <div className="wc-card-author">
                          <span className="wc-brand-dot" />
                          {item.author}
                        </div>

                        <h3 className="wc-card-title">
                          {item.title || item.name}
                        </h3>

                        <div className="wc-card-tags">
                          {(item.category || item.subCategory) && (
                            <span className="wc-card-cat">
                              {item.category || item.subCategory}
                            </span>
                          )}
                          {item.fit && (
                            <span className="wc-card-fit">{item.fit}</span>
                          )}
                          {item.collar && (
                            <span className="wc-card-collar">
                              {item.collar}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="wc-card-desc">
                            {item.description.substring(0, 85)}...
                          </p>
                        )}

                        {item.features && item.features.length > 0 && (
                          <div className="wc-card-features">
                            {item.features.slice(0, 3).map((f, fi) => (
                              <span key={fi} className="wc-feature-chip">
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="wc-card-rating-wrapper">
                          <StarRating
                            currentRating={item.rating}
                            userRating={currentProductRating}
                            onRate={(rating) =>
                              handleRateProduct(item.id, rating)
                            }
                            readonly={false}
                            showLabel={false}
                            size="small"
                          />
                          <span className="wc-rating-reviews">
                            {item.reviews ?? 0} reviews
                          </span>
                        </div>

                        {item.colors && item.colors.length > 0 && (
                          <div className="wc-card-colors">
                            {item.colors.map((c, ci) => (
                              <span
                                key={ci}
                                className="wc-color-dot"
                                style={{ background: c }}
                              />
                            ))}
                            <span className="wc-color-label">
                              {item.colors.length} colors
                            </span>
                          </div>
                        )}

                        {item.sizes && item.sizes.length > 0 && (
                          <div className="wc-card-sizes">
                            {item.sizes.map((s) => (
                              <span key={s} className="wc-size-mini">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="wc-sold-info">
                          <FaRegClock />
                          <span>
                            {item.soldCount?.toLocaleString() || 0} sold
                          </span>
                        </div>

                        <div className="wc-card-price">
                          <span className="wc-price-now">${item.price}</span>
                          {item.oldPrice && (
                            <span className="wc-price-was">
                              ${item.oldPrice}
                            </span>
                          )}
                          {item.oldPrice && (
                            <span className="wc-save">
                              Save ${(item.oldPrice - item.price).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="wc-card-btns">
                          <motion.button
                            className={`wc-add-btn ${
                              addedToCart.includes(item.id) ? "added" : ""
                            }`}
                            onClick={() => handleAddToCart(item)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={item.inStock === false}
                          >
                            {addedToCart.includes(item.id) ? (
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
                            className="wc-quick-btn"
                            onClick={() => openQuickView(item)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            title="Quick View"
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
          )}
        </div>
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="wc-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="wc-modal wc-modal-enhanced"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="wc-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>

              <div className="wc-modal-grid">
                <div className="wc-modal-img">
                  <img
                    src={quickView.image}
                    alt={quickView.title || quickView.name}
                  />

                  {quickView.badge && (
                    <span
                      className="wc-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}

                  {getDiscount(quickView.oldPrice, quickView.price) > 0 && (
                    <span className="wc-discount-tag wc-modal-discount">
                      -
                      {getDiscount(quickView.oldPrice, quickView.price)}%
                    </span>
                  )}

                  {(quickView.collar || quickView.sleeve) && (
                    <div className="wc-img-tags wc-tags-modal">
                      {quickView.collar && (
                        <span className="wc-collar-tag">
                          {quickView.collar}
                        </span>
                      )}
                      {quickView.sleeve && (
                        <span className="wc-sleeve-tag">
                          {quickView.sleeve}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="wc-modal-info">
                  <div className="wc-card-author">
                    <span className="wc-brand-dot" />
                    {quickView.author}
                  </div>

                  <h2>{quickView.title || quickView.name}</h2>

                  <div className="wc-card-tags">
                    {(quickView.category || quickView.subCategory) && (
                      <span className="wc-card-cat">
                        {quickView.category || quickView.subCategory}
                      </span>
                    )}
                    {quickView.fit && (
                      <span className="wc-card-fit">{quickView.fit}</span>
                    )}
                    {quickView.collar && (
                      <span className="wc-card-collar">
                        {quickView.collar}
                      </span>
                    )}
                    {quickView.sleeve && (
                      <span className="wc-card-fit">{quickView.sleeve}</span>
                    )}
                  </div>

                  <div
                    className="wc-modal-rating-section"
                    style={{ margin: "12px 0" }}
                  >
                    <StarRating
                      currentRating={quickView.rating}
                      userRating={userRatings[quickView.id] ?? null}
                      onRate={(rating) =>
                        handleRateProduct(quickView.id, rating)
                      }
                      readonly={false}
                      showLabel={true}
                      size="medium"
                    />
                    <span className="wc-modal-reviews">
                      ({quickView.reviews ?? 0} reviews)
                    </span>
                  </div>

                  <div className="wc-modal-price">
                    <span className="wc-price-now">${quickView.price}</span>
                    {quickView.oldPrice && (
                      <span className="wc-price-was">
                        ${quickView.oldPrice}
                      </span>
                    )}
                    {quickView.oldPrice && (
                      <span className="wc-save">
                        Save $
                        {(quickView.oldPrice - quickView.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="wc-modal-sold">
                    <FaRegClock />
                    <span>
                      {quickView.soldCount?.toLocaleString() || 0} sold
                    </span>
                  </div>

                  <div className="wc-modal-tabs">
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`wc-tab ${
                          modalTab === tab ? "active" : ""
                        }`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="wc-tab-content">
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
                          "No description available."}
                      </p>
                    )}

                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "N/A"}
                        </li>
                        {quickView.fit && (
                          <li>
                            <strong>Fit:</strong> {quickView.fit}
                          </li>
                        )}
                        {quickView.collar && (
                          <li>
                            <strong>Collar:</strong> {quickView.collar}
                          </li>
                        )}
                        {quickView.sleeve && (
                          <li>
                            <strong>Sleeve:</strong> {quickView.sleeve}
                          </li>
                        )}
                        {quickView.features && quickView.features.length > 0 && (
                          <li>
                            <strong>Features:</strong>{" "}
                            {quickView.features.join(", ")}
                          </li>
                        )}
                        <li>
                          <strong>Category:</strong>{" "}
                          {quickView.category ||
                            quickView.subCategory ||
                            "N/A"}
                        </li>
                        <li>
                          <strong>Brand:</strong> {quickView.author || "N/A"}
                        </li>
                        <li>
                          <strong>Sold:</strong>{" "}
                          {quickView.soldCount?.toLocaleString() || 0} units
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

                  {quickView.colors && quickView.colors.length > 0 && (
                    <div className="wc-modal-section">
                      <h4>Color</h4>
                      <div className="wc-modal-colors">
                        {quickView.colors.map((c, ci) => (
                          <div
                            key={ci}
                            className={`wc-modal-color ${
                              modalColor === c ? "selected" : ""
                            }`}
                            style={{ background: c }}
                            onClick={() => setModalColor(c)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {quickView.sizes && quickView.sizes.length > 0 && (
                    <div className="wc-modal-section">
                      <h4>Size</h4>
                      <div className="wc-modal-sizes">
                        {quickView.sizes.map((s) => (
                          <button
                            key={s}
                            className={`wc-modal-size ${
                              modalSize === s ? "selected" : ""
                            }`}
                            onClick={() => setModalSize(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="wc-modal-section">
                    <h4>Quantity</h4>
                    <div className="wc-qty">
                      <button
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      >
                        <FaMinus />
                      </button>
                      <span>{modalQty}</span>
                      <button onClick={() => setModalQty((q) => q + 1)}>
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  <div className="wc-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="wc-modal-actions">
                    <motion.button
                      className={`wc-modal-cart ${
                        addedToCart.includes(quickView.id) ? "added" : ""
                      }`}
                      onClick={handleModalAddToCart}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={quickView.inStock === false}
                    >
                      {addedToCart.includes(quickView.id) ? (
                        <>
                          <FaCheck /> Added
                        </>
                      ) : (
                        <>
                          <FaShoppingCart /> Add to Cart
                        </>
                      )}
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

export default Wishlist;
