import {
  FaShoppingCart,
  FaHeart,
  FaUserAlt,
  FaSearch,
  FaBars,
  FaChevronDown,
  FaChevronRight,
  FaMale,
  FaFemale,
  FaChild,
  FaTshirt,
  FaShoePrints,
  FaGlasses,
  FaHatCowboy,
  GiArmoredPants,
  GiShorts,
} from "../icons";
import "./Navbar.css";
import { useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../pages/Auth/authSlice";
const Search = lazy(() => import("../../pages/Search/Search"));


const shopItems = [
  { label: "Men", icon: <FaMale />, path: "/menclothing" },
  { label: "Women", icon: <FaFemale />, path: "/womenclothing" },
  { label: "Kids", icon: <FaChild />, path: "/kidsclothing" },
];

const categoriesData = [
  {
    label: "Pants",
    icon: <GiArmoredPants />,
    subs: [
      { label: "Men", icon: <FaMale />, path: "/menpants" },
      { label: "Women", icon: <FaFemale />, path: "/womenpants" },
      { label: "Kids", icon: <FaChild />, path: "/kidspants" },
    ],
  },
  {
    label: "Shirt",
    icon: <FaTshirt />,
    subs: [
      { label: "Men", icon: <FaMale />, path: "/menshirts" },
      { label: "Women", icon: <FaFemale />, path: "/womenshirts" },
      { label: "Kids", icon: <FaChild />, path: "/kidsshirts" },
    ],
  },
  {
    label: "Shoes",
    icon: <FaShoePrints />,
    subs: [
      { label: "Men", icon: <FaMale />, path: "/menshoes" },
      { label: "Women", icon: <FaFemale />, path: "/womenshoes" },
      { label: "Kids", icon: <FaChild />, path: "/kidsshoes" },
    ],
  },
  { label: "Cap", icon: <FaHatCowboy />, path: "/capscollection", subs: [] },
  {
    label: "Sunglasses",
    icon: <FaGlasses />,
    subs: [
      { label: "Men", icon: <FaMale />, path: "/menglasses" },
      { label: "Women", icon: <FaFemale />, path: "/womenglasses" },
      { label: "Kids", icon: <FaChild />, path: "/kidsglasses" },
    ],
  },
  {
    label: "Cropped Pants",
    icon: <GiShorts />,
    subs: [
      { label: "Men", icon: <FaMale />, path: "/mencroppedpants" },
      { label: "Women", icon: <FaFemale />, path: "/womencroppedpants" },
      { label: "Kids", icon: <FaChild />, path: "/kidscroppedpants" },
    ],
  },
  {
    label: "T-Shirt",
    icon: <FaTshirt />,
    subs: [
      { label: "Men", icon: <FaMale />, path: "/mentshirts" },
      { label: "Women", icon: <FaFemale />, path: "/womentshirts" },
      { label: "Kids", icon: <FaChild />, path: "/kidstshirts" },
    ],
  },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchMounted, setIsSearchMounted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileActiveCat, setMobileActiveCat] = useState(null);

  const authWrapperRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart?.items || []);
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const wishlist = useSelector((state) => state.wishlist?.items || []);
  const wishlistCount = wishlist.length;

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (authWrapperRef.current && !authWrapperRef.current.contains(e.target)) {
        setAuthOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchMounted(true);
    setIsSearchOpen((prev) => !prev);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const toggleAuth = useCallback(() => {
    setAuthOpen((prev) => !prev);
  }, []);

  const handleAuthNavigation = useCallback(
    (path) => {
      setAuthOpen(false);
      navigate(path);
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    dispatch(logout());
    setAuthOpen(false);
    navigate("/");
  }, [dispatch, navigate]);

  const handleNavigation = useCallback(
    (path) => {
      navigate(path);
      setMenuOpen(false);
      setActiveCategory(null);
      setMobileShopOpen(false);
      setMobileCategoriesOpen(false);
      setMobileActiveCat(null);
    },
    [navigate]
  );

  const closeMobileMenu = useCallback(() => {
    setMenuOpen(false);
    setMobileShopOpen(false);
    setMobileCategoriesOpen(false);
    setMobileActiveCat(null);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    if (menuOpen) {
      closeMobileMenu();
      return;
    }

    if (!menuMounted) {
      setMenuMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
      return;
    }

    setMenuOpen(true);
  }, [menuOpen, menuMounted, closeMobileMenu]);

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="logo" onClick={() => handleNavigation("/")}>
          👕 <span>FashionStore</span>
        </div>

        <ul className="nav-links desktop-menu">
          <li className="nav-item" onClick={() => handleNavigation("/")}>
            Home
          </li>

          <li className="nav-item has-dropdown">
            <div className="nav-item-label">
              Shop <FaChevronDown className="chevron" />
            </div>
            <div className="dropdown-panel shop-dropdown">
              <div className="dropdown-header">
                <span>🛍️ Shop By Gender</span>
              </div>
              <div className="dropdown-list">
                {shopItems.map((item) => (
                  <div
                    className="dropdown-item"
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <span className="dropdown-item-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </li>

          <li
            className="nav-item has-dropdown has-mega"
            onMouseLeave={() => setActiveCategory(null)}
          >
            <div className="nav-item-label">
              Categories <FaChevronDown className="chevron" />
            </div>
            <div className="mega-menu">
              <div className="mega-left">
                <div className="dropdown-header">
                  <span>📂 All Categories</span>
                </div>
                {categoriesData.map((cat, i) => (
                  <div
                    className={`mega-item ${activeCategory === i ? "active" : ""}`}
                    key={cat.label}
                    onMouseEnter={() => setActiveCategory(i)}
                    onClick={() => {
                      if (cat.subs.length === 0 && cat.path) {
                        handleNavigation(cat.path);
                      }
                    }}
                  >
                    <span className="mega-item-icon">{cat.icon}</span>
                    <span className="mega-item-label">{cat.label}</span>
                    {cat.subs.length > 0 && <FaChevronRight className="arrow" />}
                  </div>
                ))}
              </div>

              {activeCategory !== null && categoriesData[activeCategory].subs.length > 0 && (
                <div className="mega-right" key={activeCategory}>
                  <div className="dropdown-header">
                    <span>
                      {categoriesData[activeCategory].icon}{" "}
                      {categoriesData[activeCategory].label}
                    </span>
                  </div>
                  {categoriesData[activeCategory].subs.map((sub) => (
                    <div
                      className="sub-item"
                      key={sub.path}
                      onClick={() => handleNavigation(sub.path)}
                    >
                      <span className="sub-icon">{sub.icon}</span>
                      <span>{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </li>

          <li className="nav-item" onClick={() => handleNavigation("/about")}>
            About
          </li>
        </ul>

        {menuMounted && (
          <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
            <div className="mobile-menu-content">
              <div className="mobile-menu-header">
                <div className="mobile-header-top">
                  <div className="mobile-logo" onClick={() => handleNavigation("/")}>
                    👕 <span>FashionStore</span>
                  </div>
                </div>
              </div>

              <div className="mobile-auth-section">
                {isAuthenticated ? (
                  <div className="mobile-user-card">
                    <div className="user-avatar">
                      <FaUserAlt />
                    </div>
                    <div className="user-info">
                      <div className="user-name">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mobile-auth-buttons">
                    <button
                      className="mobile-login-btn"
                      onClick={() => handleAuthNavigation("/login")}
                    >
                      <FaUserAlt /> Login
                    </button>
                    <button
                      className="mobile-register-btn"
                      onClick={() => handleAuthNavigation("/register")}
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>

              <div className="mobile-nav-links">
                <div
                  className="mobile-nav-item"
                  onClick={() => handleNavigation("/")}
                >
                  <span>🏠 Home</span>
                </div>

                <div className="mobile-nav-item mobile-accordion">
                  <div
                    className="mobile-accordion-header"
                    onClick={() => setMobileShopOpen(!mobileShopOpen)}
                  >
                    <span>🛍️ Shop</span>
                    <FaChevronDown
                      className={`accordion-icon ${mobileShopOpen ? "rotate" : ""}`}
                    />
                  </div>
                  <div
                    className={`mobile-accordion-content ${mobileShopOpen ? "open" : ""}`}
                  >
                    <div className="mobile-accordion-inner">
                      {shopItems.map((item) => (
                        <div
                          key={item.path}
                          className="mobile-sub-item"
                          onClick={() => handleNavigation(item.path)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mobile-nav-item mobile-accordion">
                  <div
                    className="mobile-accordion-header"
                    onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  >
                    <span>📂 Categories</span>
                    <FaChevronDown
                      className={`accordion-icon ${mobileCategoriesOpen ? "rotate" : ""}`}
                    />
                  </div>
                  <div
                    className={`mobile-accordion-content ${mobileCategoriesOpen ? "open" : ""}`}
                  >
                    <div className="mobile-accordion-inner">
                      {categoriesData.map((cat, idx) => (
                        <div key={cat.label}>
                          <div
                            className="mobile-category-item"
                            onClick={() => {
                              if (cat.subs.length === 0 && cat.path) {
                                handleNavigation(cat.path);
                              } else {
                                setMobileActiveCat(mobileActiveCat === idx ? null : idx);
                              }
                            }}
                          >
                            <div className="mobile-category-label">
                              {cat.icon}
                              <span>{cat.label}</span>
                            </div>
                            {cat.subs.length > 0 && (
                              <FaChevronRight
                                className={`sub-arrow ${mobileActiveCat === idx ? "rotate" : ""}`}
                              />
                            )}
                          </div>
                          {cat.subs.length > 0 && (
                            <div
                              className={`mobile-sub-category ${mobileActiveCat === idx ? "open" : ""}`}
                            >
                              <div className="mobile-accordion-inner">
                                {cat.subs.map((sub) => (
                                  <div
                                    key={sub.path}
                                    className="mobile-sub-item"
                                    onClick={() => handleNavigation(sub.path)}
                                  >
                                    {sub.icon}
                                    <span>{sub.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className="mobile-nav-item"
                  onClick={() => handleNavigation("/about")}
                >
                  <span>ℹ️ About</span>
                </div>
              </div>

              {isAuthenticated && (
                <div className="mobile-menu-footer">
                  <button
                    className="mobile-logout-btn"
                    onClick={() => handleNavigation("/orders")}
                  >
                    📦 My Orders
                  </button>
                  <button className="mobile-logout-btn" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {menuMounted && (
          <div
            className={`mobile-menu-backdrop ${menuOpen ? "open" : ""}`}
            onClick={toggleMobileMenu}
          />
        )}

        <div className="nav-icons">
          <div className="icon-wrapper" onClick={toggleSearch} title="Search">
            <FaSearch className="nav-icon" />
          </div>

          <div
            className="icon-wrapper"
            onClick={() => handleNavigation("/wishlist")}
            title="Wishlist"
          >
            <FaHeart className="nav-icon" />
            {wishlistCount > 0 && (
              <span className="badge" key={wishlistCount}>
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </div>

          <div
            className="icon-wrapper"
            onClick={() => handleNavigation("/cart")}
            title="Cart"
          >
            <FaShoppingCart className="nav-icon" />
            {cartCount > 0 && (
              <span className="badge" key={cartCount}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>

          <div className="icon-wrapper auth-wrapper desktop-only" ref={authWrapperRef}>
            <FaUserAlt className="nav-icon" onClick={toggleAuth} />
            {authOpen && (
              <div className="auth-dropdown">
                {isAuthenticated ? (
                  <>
                    <div className="auth-user-info">
                      <span className="auth-user-name">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="auth-user-email">{user?.email}</span>
                    </div>
                    <button
                      className="login-btn"
                      onClick={() => handleAuthNavigation("/orders")}
                    >
                      My Orders
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="login-btn"
                      onClick={() => handleAuthNavigation("/login")}
                    >
                      Login
                    </button>
                    <button
                      className="register-btn"
                      onClick={() => handleAuthNavigation("/register")}
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="menu-toggle mobile-only" onClick={toggleMobileMenu}>
            <FaBars />
          </div>
        </div>
      </nav>

      {isSearchMounted && (
        <Suspense fallback={null}>
          <Search isOpen={isSearchOpen} onClose={closeSearch} />
        </Suspense>
      )}

    </>
  );
};

export default Navbar;
