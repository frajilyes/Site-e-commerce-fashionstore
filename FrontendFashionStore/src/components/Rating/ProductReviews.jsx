import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { FaStar, FaRegStar, FaTrash, FaPen, FaUserCircle } from "react-icons/fa";
import StarRating from "./StarRating";
import { setRating } from "./ratingsSlice";
import { saveReview, deleteReview } from "./reviewsSlice";
import "./ProductReviews.css";

const MIN_COMMENT = 3;
const MAX_COMMENT = 500;

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const StaticStars = ({ value }) => (
  <span className="pr-static-stars">
    {[1, 2, 3, 4, 5].map((s) =>
      s <= value ? <FaStar key={s} className="filled" /> : <FaRegStar key={s} />,
    )}
  </span>
);

const ProductReviews = ({ productId, baseRating = 0, baseCount = 0 }) => {
  const dispatch = useDispatch();

  const reviews = useSelector((state) => state.reviews.byProduct[productId]);
  const user = useSelector((state) => state.auth.user);
  const userRatings = useSelector((state) => state.ratings.userRatings);

  const authorId = user ? `user-${user.id}` : "guest";
  const authorName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer"
    : "Guest";

  const productReviews = useMemo(
    () =>
      [...(reviews || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [reviews],
  );

  const myReview = productReviews.find((r) => r.authorId === authorId) || null;

  const [draftRating, setDraftRating] = useState(
    () => myReview?.rating || userRatings[productId] || 0,
  );
  const [comment, setComment] = useState(() => myReview?.comment || "");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const showForm = !myReview || isEditing;

  const { average, total } = useMemo(() => {
    const userSum = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const count = baseCount + productReviews.length;
    if (!count) return { average: 0, total: 0 };
    return {
      average: (baseRating * baseCount + userSum) / count,
      total: count,
    };
  }, [productReviews, baseRating, baseCount]);

  const distribution = useMemo(() => {
    const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    productReviews.forEach((r) => {
      buckets[r.rating] = (buckets[r.rating] || 0) + 1;
    });
    return buckets;
  }, [productReviews]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = comment.trim();

    if (!draftRating) {
      setError("Please select a rating.");
      return;
    }
    if (trimmed.length < MIN_COMMENT) {
      setError(`Your comment must be at least ${MIN_COMMENT} characters.`);
      return;
    }

    dispatch(
      saveReview({
        productId,
        authorId,
        author: authorName,
        rating: draftRating,
        comment: trimmed,
      }),
    );
    dispatch(setRating({ productId, rating: draftRating }));

    setError("");
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleEdit = () => {
    setDraftRating(myReview.rating);
    setComment(myReview.comment);
    setError("");
    setIsEditing(true);
  };

  const handleDelete = () => {
    dispatch(deleteReview({ productId, reviewId: myReview.id }));
    setDraftRating(0);
    setComment("");
    setError("");
    setIsEditing(false);
  };

  return (
    <div className="pr-container">
      <div className="pr-summary">
        <div className="pr-summary-score">
          <span className="pr-average">{average.toFixed(1)}</span>
          <StaticStars value={Math.round(average)} />
          <span className="pr-total">
            {total.toLocaleString()} review{total > 1 ? "s" : ""}
          </span>
        </div>

        <div className="pr-summary-bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = productReviews.length
              ? (count / productReviews.length) * 100
              : 0;
            return (
              <div key={star} className="pr-bar-row">
                <span className="pr-bar-label">
                  {star} <FaStar />
                </span>
                <div className="pr-bar-track">
                  <motion.div
                    className="pr-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className="pr-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showForm ? (
        <form className="pr-form" onSubmit={handleSubmit}>
          <h4 className="pr-form-title">
            {isEditing ? "Edit your review" : "Write a review"}
          </h4>

          <div className="pr-form-rating">
            <span className="pr-form-label">Your rating</span>
            <StarRating
              currentRating={0}
              userRating={draftRating || null}
              onRate={(value) => {
                setDraftRating(value);
                setError("");
              }}
              showLabel={false}
              size="medium"
            />
          </div>

          <label className="pr-form-label" htmlFor={`pr-comment-${productId}`}>
            Your comment
          </label>
          <textarea
            id={`pr-comment-${productId}`}
            className="pr-textarea"
            value={comment}
            maxLength={MAX_COMMENT}
            rows={4}
            placeholder="Tell others what you think about this product..."
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError("");
            }}
          />

          <div className="pr-form-footer">
            <span className="pr-counter">
              {comment.length}/{MAX_COMMENT}
            </span>
            <div className="pr-form-actions">
              {isEditing && (
                <button
                  type="button"
                  className="pr-btn pr-btn-ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="pr-btn pr-btn-primary">
                {isEditing ? "Update review" : "Submit review"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="pr-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      ) : (
        <div className="pr-own-actions">
          <span className="pr-own-label">
            You already reviewed this product
          </span>
          <div className="pr-form-actions">
            <button
              type="button"
              className="pr-btn pr-btn-ghost"
              onClick={handleEdit}
            >
              <FaPen /> Edit
            </button>
            <button
              type="button"
              className="pr-btn pr-btn-danger"
              onClick={handleDelete}
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {justSaved && (
          <motion.p
            className="pr-success"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✅ Thanks! Your review has been saved.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="pr-list">
        {productReviews.length === 0 ? (
          <p className="pr-empty">No customer comment yet. Be the first!</p>
        ) : (
          productReviews.map((review) => (
            <motion.div
              key={review.id}
              className={`pr-item ${review.authorId === authorId ? "mine" : ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="pr-item-head">
                <FaUserCircle className="pr-avatar" />
                <div className="pr-item-meta">
                  <span className="pr-item-author">
                    {review.author}
                    {review.authorId === authorId && (
                      <span className="pr-badge-you">You</span>
                    )}
                  </span>
                  <span className="pr-item-date">
                    {formatDate(review.date)}
                    {review.edited ? " · edited" : ""}
                  </span>
                </div>
                <StaticStars value={review.rating} />
              </div>
              <p className="pr-item-comment">{review.comment}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
