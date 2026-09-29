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
  FaMale,
  FaRulerVertical,
  FaTshirt,
} from "react-icons/fa";
import "./MenShirts.css";

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
  "Dress Shirts",
  "Casual Shirts",
  "Oxford",
  "Linen",
  "Flannel",
  "Denim",
  "Hawaiian",
  "Polo",
];

const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

const collarTypes = [
  "All",
  "Spread",
  "Button-Down",
  "Mandarin",
  "Camp",
  "Point",
  "Band",
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

const MenShirts = () => {
  const { allProducts: products } = useCatalog();

  const dispatch = useDispatch();

  const allShirts = products.filter(
    (product) => product.audience === "men" && product.category === "Shirts",
  );

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const userRatings = useSelector((state) => state.ratings.userRatings);

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);

  const [activeFilter, setActiveFilter] = useState("All");
  const [addedToCart, setAddedToCart] = useState([]);
  const [quickView, setQuickView] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [modalQty, setModalQty] = useState(1);
  const [modalSize, setModalSize] = useState(null);
  const [modalColor, setModalColor] = useState(null);
  const [modalTab, setModalTab] = useState("description");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedCollar, setSelectedCollar] = useState("All");

  const [wishlistNotif, setWishlistNotif] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const handleRateProduct = (productId, rating) => {
    dispatch(setRating({ productId, rating }));
  };

  let filtered =
    activeFilter === "All"
      ? [...allShirts]
      : allShirts.filter((p) => p.subCategory === activeFilter);

  if (selectedSize)
    filtered = filtered.filter((p) => p.sizes?.includes(selectedSize));

  if (selectedCollar !== "All")
    filtered = filtered.filter((p) => p.collar === selectedCollar);

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
          category: product.subCategory,
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

  const clearAllFilters = () => {
    setActiveFilter("All");
    setSelectedSize(null);
    setSelectedCollar("All");
    setVisibleCount(12);
  };

  return (
    <div className="ms-page">
      <AnimatePresence>
        {wishlistNotif && (
          <motion.div
            className="ms-wishlist-toast"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FaHeart
              className={
                wishlistNotif.action === "added"
                  ? "ms-toast-heart-added"
                  : "ms-toast-heart-removed"
              }
            />
            {wishlistNotif.action === "added"
              ? "Added to Wishlist!"
              : "Removed from Wishlist"}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="ms-hero">
        <div className="ms-hero-bg" />
        <div className="ms-hero-overlay" />
        <div className="ms-hero-gradient" />
        <div className="ms-glow msg1" />
        <div className="ms-glow msg2" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="ms-particle"
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

        <div className="ms-hero-content">
          <motion.div
            className="ms-breadcrumb"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span>Home</span> / <span>Shop</span> / <span>Men</span> /{" "}
            <span className="ms-bread-active">Shirts</span>
          </motion.div>

          <motion.div
            className="ms-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <FaTshirt className="ms-tag-icon" />
            <FaMale className="ms-tag-icon" />
            Men's Shirts Collection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Sharp Shirts,
            <br />
            <span className="ms-neon">Bold Moves</span>
          </motion.h1>

          <motion.p
            className="ms-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            From crisp dress shirts to relaxed linens — find the perfect shirt
            <br />
            for every occasion, every season, every you.
          </motion.p>

          <motion.div
            className="ms-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="ms-feat">
              <FaTruck /> Free Shipping
            </div>
            <div className="ms-feat">
              <FaShieldAlt /> Premium Fabrics
            </div>
            <div className="ms-feat">
              <FaUndo /> 30-Day Returns
            </div>
            <div className="ms-feat">
              <FaRulerVertical /> Fit Guide
            </div>
          </motion.div>
        </div>
      </section>

      <section className="ms-filter-bar">
        <div className="ms-filter-row">
          <div className="ms-filter-left">
            <FaFilter className="ms-filter-icon" />
            <div className="ms-chips">
              {subCategories.map((c, i) => (
                <motion.button
                  key={i}
                  className={`ms-chip ${activeFilter === c ? "active" : ""}`}
                  onClick={() => { setActiveFilter(c); setVisibleCount(12); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="ms-filter-right">
            <div className="ms-collar-filter">
              <span className="ms-collar-label">Collar:</span>
              <select
                className="ms-collar-select"
                value={selectedCollar}
                onChange={(e) => setSelectedCollar(e.target.value)}
              >
                {collarTypes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ms-size-filter">
              <span className="ms-size-label">Size:</span>
              <div className="ms-size-chips">
                {shirtSizes.map((s) => (
                  <button
                    key={s}
                    className={`ms-size-btn ${selectedSize === s ? "active" : ""}`}
                    onClick={() =>
                      setSelectedSize(selectedSize === s ? null : s)
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="ms-sort-wrap">
              <button
                className="ms-sort-btn"
                onClick={() => setSortOpen(!sortOpen)}
              >
                Sort By <FaChevronDown />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="ms-sort-drop"
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
                        className={`ms-sort-item ${sortBy === s.v ? "active" : ""}`}
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

        <div className="ms-results-info">
          <span className="ms-count">
            <span>{filtered.length}</span> shirts found
          </span>
          {activeFilter !== "All" && (
            <span className="ms-active-tag">
              {activeFilter}
              <FaTimes
                className="ms-clear"
                onClick={() => { setActiveFilter("All"); setVisibleCount(12); }}
              />
            </span>
          )}
          {selectedCollar !== "All" && (
            <span className="ms-active-tag">
              Collar: {selectedCollar}
              <FaTimes
                className="ms-clear"
                onClick={() => setSelectedCollar("All")}
              />
            </span>
          )}
          {selectedSize && (
            <span className="ms-active-tag">
              Size: {selectedSize}
              <FaTimes
                className="ms-clear"
                onClick={() => setSelectedSize(null)}
              />
            </span>
          )}
        </div>
      </section>

      <section className="ms-grid-section">
        <motion.div className="ms-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, i) => (
              <motion.div
                className="ms-card"
                key={product.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                exit="exit"
                viewport={{ once: true }}
                custom={i}
                layout
              >
                <div className="ms-card-img">
                  <img src={product.image} alt={product.title} />

                  {product.badge && (
                    <span
                      className="ms-badge"
                      style={{ background: product.badgeColor }}
                    >
                      {product.badge}
                    </span>
                  )}

                  <span className="ms-discount-tag">
                    -
                    {getDiscount(
                      product.oldPrice || product.price,
                      product.price,
                    )}
                    %
                  </span>

                  <div className="ms-img-tags">
                    <span className="ms-collar-tag">
                      {product.collar || "Classic"}
                    </span>
                    <span className="ms-sleeve-tag">
                      {product.sleeve || "Long"}
                    </span>
                  </div>

                  {!product.inStock && (
                    <div className="ms-sold-out">
                      <span>Sold Out</span>
                    </div>
                  )}

                  <motion.button
                    className={`ms-heart ${isInWishlist(product.id) ? "liked" : ""}`}
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

                <div className="ms-card-body">
                  <div className="ms-card-author">
                    <span className="ms-brand-dot" />
                    {product.author || "Brand"}
                  </div>

                  <h3 className="ms-card-title">{product.title}</h3>

                  <div className="ms-card-tags">
                    <span className="ms-card-cat">
                      {product.subCategory || product.category}
                    </span>
                    <span className="ms-card-fit">
                      {product.fit || "Regular"}
                    </span>
                    <span className="ms-card-collar">
                      {product.collar || "Classic"}
                    </span>
                  </div>

                  <p className="ms-card-desc">
                    {product.description?.substring(0, 85) ||
                      "Premium quality shirt"}
                    ...
                  </p>

                  <div className="ms-card-features">
                    {(product.features || []).slice(0, 3).map((f, fi) => (
                      <span key={fi} className="ms-feature-chip">
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

                  <div className="ms-card-colors">
                    {(product.colors || []).map((c, ci) => (
                      <span
                        key={ci}
                        className="ms-color-dot"
                        style={{ background: c }}
                      />
                    ))}
                    <span className="ms-color-label">
                      {(product.colors || []).length} colors
                    </span>
                  </div>

                  <div className="ms-card-sizes">
                    {(product.sizes || []).map((s) => (
                      <span key={s} className="ms-size-mini">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="ms-sold-info">
                    <FaRegClock />
                    <span>
                      {(product.soldCount || 0).toLocaleString()} sold
                    </span>
                  </div>

                  <div className="ms-card-price">
                    <span className="ms-price-now">${product.price}</span>
                    <span className="ms-price-was">
                      ${product.oldPrice || product.price}
                    </span>
                    <span className="ms-save">
                      Save $
                      {(
                        (product.oldPrice || product.price) - product.price
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="ms-card-btns">
                    <motion.button
                      className={`ms-add-btn ${
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
                      className="ms-quick-btn"
                      onClick={() => openQuickView(product)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      title="Quick View"
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
          <div className="ms-no-results">
            <FaTshirt className="ms-no-icon" />
            <h3>No shirts found</h3>
            <p>Try adjusting your filters</p>
            <button onClick={clearAllFilters}>Clear All Filters</button>
          </div>
        )}

        {hasMore && (
          <div className="ms-load-more">
            <motion.button
              className="ms-load-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
            >
              Load More Shirts <FaArrowRight />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {quickView && (
          <motion.div
            className="ms-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
          >
            <motion.div
              className="ms-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="ms-modal-close"
                onClick={() => setQuickView(null)}
              >
                <FaTimes />
              </button>

              <div className="ms-modal-grid">
                <div className="ms-modal-img">
                  <img src={quickView.image} alt={quickView.title} />
                  {quickView.badge && (
                    <span
                      className="ms-badge"
                      style={{ background: quickView.badgeColor }}
                    >
                      {quickView.badge}
                    </span>
                  )}
                  <div className="ms-img-tags ms-tags-modal">
                    <span className="ms-collar-tag">
                      {quickView.collar || "Classic"}
                    </span>
                    <span className="ms-sleeve-tag">
                      {quickView.sleeve || "Long"}
                    </span>
                  </div>
                </div>

                <div className="ms-modal-info">
                  <div className="ms-card-author">
                    <span className="ms-brand-dot" />
                    {quickView.author || "Brand"}
                  </div>

                  <h2>{quickView.title}</h2>

                  <div className="ms-card-tags">
                    <span className="ms-card-cat">
                      {quickView.subCategory || quickView.category}
                    </span>
                    <span className="ms-card-fit">
                      {quickView.fit || "Regular"}
                    </span>
                    <span className="ms-card-collar">
                      {quickView.collar || "Classic"}
                    </span>
                    <span className="ms-card-fit">
                      {quickView.sleeve || "Long"}
                    </span>
                  </div>

                  <div
                    className="ms-modal-rating-wrapper"
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

                  <div className="ms-card-price" style={{ margin: "10px 0" }}>
                    <span className="ms-price-now">${quickView.price}</span>
                    <span className="ms-price-was">
                      ${quickView.oldPrice || quickView.price}
                    </span>
                    <span className="ms-save">
                      -
                      {getDiscount(
                        quickView.oldPrice || quickView.price,
                        quickView.price,
                      )}
                      %
                    </span>
                  </div>

                  <div className="ms-modal-tabs">
                    {["description", "details", "shipping", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        className={`ms-tab ${modalTab === tab ? "active" : ""}`}
                        onClick={() => setModalTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="ms-tab-content">
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
                          "Premium quality shirt for any occasion."}
                      </p>
                    )}
                    {modalTab === "details" && (
                      <ul>
                        <li>
                          <strong>Material:</strong>{" "}
                          {quickView.material || "Cotton"}
                        </li>
                        <li>
                          <strong>Fit:</strong> {quickView.fit || "Regular"}
                        </li>
                        <li>
                          <strong>Collar:</strong>{" "}
                          {quickView.collar || "Classic"}
                        </li>
                        <li>
                          <strong>Sleeve:</strong> {quickView.sleeve || "Long"}
                        </li>
                        <li>
                          <strong>Features:</strong>{" "}
                          {(quickView.features || []).join(", ") ||
                            "Premium quality"}
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

                  <div className="ms-modal-section">
                    <h4>Color</h4>
                    <div className="ms-modal-colors">
                      {(quickView.colors || []).map((c, ci) => (
                        <div
                          key={ci}
                          className={`ms-modal-color ${
                            modalColor === c ? "selected" : ""
                          }`}
                          style={{ background: c }}
                          onClick={() => setModalColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="ms-modal-section">
                    <h4>Size</h4>
                    <div className="ms-modal-sizes">
                      {(quickView.sizes || []).map((s) => (
                        <button
                          key={s}
                          className={`ms-modal-size ${
                            modalSize === s ? "selected" : ""
                          }`}
                          onClick={() => setModalSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ms-modal-section">
                    <h4>Quantity</h4>
                    <div className="ms-qty">
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

                  <div className="ms-modal-total">
                    Total:{" "}
                    <span>${(quickView.price * modalQty).toFixed(2)}</span>
                  </div>

                  <div className="ms-modal-actions">
                    <motion.button
                      className="ms-modal-cart"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleModalAddToCart}
                    >
                      <FaShoppingCart /> Add to Cart
                    </motion.button>

                    <motion.button
                      className={`ms-modal-wish ${
                        isInWishlist(quickView.id) ? "wished" : ""
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

export default MenShirts;
