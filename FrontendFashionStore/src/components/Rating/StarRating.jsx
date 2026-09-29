import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar } from "react-icons/fa";
import "./StarRating.css";

const StarRating = ({
  currentRating = 0,
  userRating = null,
  onRate,
  readonly = false,
  showLabel = true,
  size = "medium",
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClick = (rating) => {
    if (readonly) return;

    onRate(rating);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const displayRating = hoverRating || userRating || currentRating;

  return (
    <div className={`star-rating-container star-size-${size}`}>
      <div className={`star-rating-wrapper ${isMobile ? "mobile" : ""}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            className={`star-btn ${star <= displayRating ? "filled" : ""} ${
              userRating === star ? "user-rated" : ""
            }`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && !isMobile && setHoverRating(star)}
            onMouseLeave={() => !readonly && !isMobile && setHoverRating(0)}
            onTouchStart={() => !readonly && setHoverRating(star)}
            onTouchEnd={() => !readonly && setHoverRating(0)}
            whileHover={!readonly ? { scale: 1.2 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            disabled={readonly}
            title={readonly ? "" : `Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <FaStar />
          </motion.button>
        ))}
      </div>

      {showLabel && (
        <div className="star-rating-info">
          <span className="star-rating-value">
            {userRating ? (
              <>
                Your rating: <strong>{userRating}.0</strong>
              </>
            ) : (
              <>
                {currentRating.toFixed(1)} <span className="star-rating-muted">(average)</span>
              </>
            )}
          </span>
        </div>
      )}

      <AnimatePresence>
        {showToast && (
          <motion.div
            className="star-rating-toast"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            ✨ Rated {userRating} star{userRating > 1 ? "s" : ""}!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StarRating;
