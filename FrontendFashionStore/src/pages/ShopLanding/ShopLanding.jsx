import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaMale,
  FaFemale,
  FaChild,
  FaArrowRight,
  FaTruck,
  FaShieldAlt,
  FaUndo
} from "react-icons/fa";
import "./ShopLanding.css";

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x1: parseFloat((Math.random() * 100).toFixed(2)),
  x2: parseFloat((Math.random() * 100).toFixed(2)),
  size: parseFloat((2 + Math.random() * 4).toFixed(2)),
  dur: parseFloat((12 + Math.random() * 14).toFixed(2)),
  delay: parseFloat((Math.random() * 6).toFixed(2)),
  opacity: parseFloat((0.15 + Math.random() * 0.4).toFixed(2)),
}));

const ShopLanding = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: "men",
      label: "Men",
      subtitle: "Premium Streetwear & Suits",
      icon: <FaMale />,
      path: "/menclothing",
      className: "men",
    },
    {
      id: "women",
      label: "Women",
      subtitle: "Elegance & Modern Fit",
      icon: <FaFemale />,
      path: "/womenclothing",
      className: "women",
    },
    {
      id: "kids",
      label: "Kids",
      subtitle: "Playful & Cozy Outfits",
      icon: <FaChild />,
      path: "/kidsclothing",
      className: "kids",
    },
  ];

  return (
    <div className="sl-page">
      <section className="sl-hero">
        <div className="sl-hero-bg" />
        <div className="sl-hero-overlay" />
        <div className="sl-hero-gradient" />

        <div className="sl-glow g1" />
        <div className="sl-glow g2" />
        <div className="sl-glow g3" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="sl-particle"
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

        <div className="sl-hero-content">
          <motion.div
            className="sl-tag"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="sl-tag-dot" />
            FashionStyle Portal
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Select Your <span className="sl-neon">Universe</span>
          </motion.h1>

          <motion.p
            className="sl-hero-desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Step into premium curated streetwear and refined tailored outfits.
            Choose your collection below to begin.
          </motion.p>

          <div className="sl-category-btns">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                className={`sl-cat-btn ${cat.className}`}
                onClick={() => navigate(cat.path)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 15px 35px rgba(0, 255, 136, 0.15)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="sl-cat-icon">
                  {cat.icon}
                </div>
                <div className="sl-cat-text">
                  <span className="sl-cat-label">{cat.label}</span>
                  <span className="sl-cat-sub">{cat.subtitle}</span>
                </div>
                <FaArrowRight className="sl-cat-arrow" />
              </motion.button>
            ))}
          </div>

          <motion.div
            className="sl-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="sl-feature">
              <FaTruck /> Free Shipping
            </div>
            <div className="sl-feature">
              <FaShieldAlt /> Secure Checkout
            </div>
            <div className="sl-feature">
              <FaUndo /> 30-Day Returns
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ShopLanding;
