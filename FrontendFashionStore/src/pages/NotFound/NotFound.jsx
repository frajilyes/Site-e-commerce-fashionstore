import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaSearch,
  FaExclamationTriangle,
  FaArrowLeft,
  FaShoppingBag,
} from "react-icons/fa";
import "./NotFound.css";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x1: Math.random() * 100,
  x2: Math.random() * 100,
  size: 2 + Math.random() * 5,
  dur: 14 + Math.random() * 16,
  delay: Math.random() * 8,
  opacity: 0.2 + Math.random() * 0.5,
}));

const QUICK_LINKS = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/men", label: "Men's Collection", icon: FaShoppingBag },
  { path: "/women", label: "Women's Collection", icon: FaShoppingBag },
  { path: "/kids", label: "Kids Collection", icon: FaShoppingBag },
];

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="nf-page">
      <section className="nf-hero">
        <div className="nf-hero-bg" aria-hidden="true" />
        <div className="nf-hero-overlay" aria-hidden="true" />
        <div className="nf-hero-gradient" aria-hidden="true" />
        <div className="nf-glow g1" aria-hidden="true" />
        <div className="nf-glow g2" aria-hidden="true" />
        <div className="nf-glow g3" aria-hidden="true" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="nf-particle"
            aria-hidden="true"
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

        <div className="nf-hero-content">
          <motion.div
            className="nf-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="nf-tag-dot" aria-hidden="true" />
            Error 404
          </motion.div>

          <motion.div
            className="nf-error-icon-wrapper"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <FaExclamationTriangle className="nf-error-icon" aria-hidden="true" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Page Not Found
            <br />
            <span className="nf-neon">Oops! Lost in Style</span>
          </motion.h1>

          <motion.p
            className="nf-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            The page you're looking for doesn't exist or has been moved.
            <br />
            Don't worry, we'll help you find your way back to amazing fashion.
          </motion.p>

          <motion.div
            className="nf-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <motion.button
              className="nf-btn-primary"
              onClick={() => handleNavigate("/")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Go to homepage"
            >
              <FaHome aria-hidden="true" /> Back to Home
            </motion.button>

            <motion.button
              className="nf-btn-secondary"
              onClick={handleGoBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Go back to previous page"
            >
              <FaArrowLeft aria-hidden="true" /> Go Back
            </motion.button>
          </motion.div>

          <motion.div
            className="nf-error-code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            aria-hidden="true"
          >
            404
          </motion.div>
        </div>
      </section>

      <section className="nf-quick-links-section" aria-label="Quick navigation links">
        <motion.div
          className="nf-quick-links-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <FaSearch className="nf-section-icon" aria-hidden="true" />
          <h2>Explore Our Collections</h2>
          <p>Find what you're looking for in our curated sections</p>
        </motion.div>

        <div className="nf-quick-links-grid">
          {QUICK_LINKS.map((link, index) => (
            <motion.article
              key={link.path}
              className="nf-quick-link-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <button
                className="nf-quick-link-btn"
                onClick={() => handleNavigate(link.path)}
                type="button"
                aria-label={`Navigate to ${link.label}`}
              >
                <div className="nf-quick-link-icon-wrapper">
                  <link.icon className="nf-quick-link-icon" aria-hidden="true" />
                </div>
                <h3>{link.label}</h3>
                <span className="nf-quick-link-arrow">→</span>
              </button>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="nf-help-section">
        <motion.div
          className="nf-help-content"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h3>Need Help?</h3>
          <p>
            If you believe this is an error, please contact our support team.
            <br />
            We're here to assist you 24/7.
          </p>
          <motion.button
            className="nf-help-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="Contact support"
            onClick={()=>{navigate("/contact")}}
          >
            Contact Support
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};

export default NotFound;
