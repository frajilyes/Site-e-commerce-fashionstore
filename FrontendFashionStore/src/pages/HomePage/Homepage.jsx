import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./Homepage.css";

const HERO_WIDTHS = [640, 768, 1080, 1600];
const heroSrcSet = (ext) =>
  HERO_WIDTHS.map((w) => `/images/hero-${w}.${ext} ${w}w`).join(", ");

const Homepage = () => {
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.user || null);

  const handleShopNow = () => navigate("/shoplanding");
  const handleExplore = () => navigate("/about");

  return (
    <div className="hero-container">
      <picture>
        <source type="image/avif" srcSet={heroSrcSet("avif")} sizes="100vw" />
        <source type="image/webp" srcSet={heroSrcSet("webp")} sizes="100vw" />
        <img
          className="background-image"
          src="/images/hero-1600.webp"
          width="1600"
          height="1067"
          alt="Model wearing pieces from the FashionStore premium streetwear collection"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="overlay" />

      <div className="light-beam" aria-hidden="true" />

      <div className="hero-content">
        <p className="hero-subtitle">
          {user
            ? `Welcome back, ${user.firstName}!`
            : "Premium Fashion Collection 2026"}
        </p>

        <h1 className="hero-title">
          Discover Your <span>Style</span>
        </h1>

        <p className="hero-text">
          Elevate your wardrobe with our exclusive streetwear and luxury pieces.{" "}
          <br />
          Designed for those who dare to stand out.
        </p>

        <div className="hero-buttons">
          <button type="button" className="btn-primary" onClick={handleShopNow}>
            {user ? "Continue Shopping" : "Shop Now"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExplore}
          >
            Explore Our Fashion
          </button>
        </div>
      </div>

      <div className="scroll-indicator" aria-hidden="true">
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <span>Scroll</span>
      </div>
    </div>
  );
};

export default Homepage;
