import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaSignInAlt, FaLock, FaTimes, FaArrowRight } from "../icons";
import { getToken } from "../../utils/storage";
import "./LoginAlert.css";


const EXIT_DURATION = 250;

const LoginAlert = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isSessionChecked } = useSelector((state) => state.auth);

  const [delayPassed, setDelayPassed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);

  const sessionResolved = isSessionChecked || !getToken();

  useEffect(() => {
    if (!sessionResolved || isAuthenticated) return undefined;
    const timer = setTimeout(() => setDelayPassed(true), 900);
    return () => clearTimeout(timer);
  }, [sessionResolved, isAuthenticated]);

  useEffect(() => {
    if (!closing) return undefined;
    const timer = setTimeout(() => setDismissed(true), EXIT_DURATION);
    return () => clearTimeout(timer);
  }, [closing]);

  const isVisible = sessionResolved && !isAuthenticated && !dismissed && delayPassed;

  const handleClose = () => setClosing(true);

  const handleSignIn = () => {
    setDismissed(true);
    navigate("/login");
  };

  if (!isVisible) return null;

  return (
    <div
      className={`login-alert ${closing ? "closing" : ""}`}
      role="alertdialog"
      aria-live="polite"
      aria-label="Sign in required"
    >
      <div className="login-alert-glow" />

      <button
        type="button"
        className="login-alert-close"
        onClick={handleClose}
        aria-label="Close alert"
      >
        <FaTimes />
      </button>

      <div className="login-alert-icon">
        <FaLock />
      </div>

      <div className="login-alert-body">
        <h3>Sign in to complete your order</h3>
        <p>
          Create a free account or sign in to save your cart, track your orders,
          and check out securely in seconds.
        </p>
      </div>

      <button type="button" className="login-alert-cta" onClick={handleSignIn}>
        <FaSignInAlt /> Sign In <FaArrowRight />
      </button>
    </div>
  );
};

export default LoginAlert;
