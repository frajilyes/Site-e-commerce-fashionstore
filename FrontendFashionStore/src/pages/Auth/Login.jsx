import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  loginUser,
  resendVerification,
  resetAuthState,
  clearRedirectTo,
} from "./authSlice";
import {
  FaSignInAlt,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";
import GoogleAuthButton from "../../components/GoogleAuthButton/GoogleAuthButton";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, isSuccess, isError, errorMessage, errorCode, redirectTo } =
    useSelector((state) => state.auth);

  const needsVerification = isError && errorCode === "EMAIL_NOT_VERIFIED";
  const [resendState, setResendState] = useState({ sending: false, note: "" });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(loginUser(formData));
    }
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        const savedCheckoutData = sessionStorage.getItem("checkoutData");
        if (savedCheckoutData) {
          sessionStorage.removeItem("checkoutData");
        }

        dispatch(resetAuthState());

        if (redirectTo) {
          navigate(redirectTo);
          dispatch(clearRedirectTo());
        } else {
          navigate("/");
        }
      }, 2500);
      return () => clearTimeout(timer);
    }

    if (isError && !needsVerification) {
      const timer = setTimeout(() => {
        dispatch(resetAuthState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isError, needsVerification, navigate, dispatch, redirectTo]);

  const handleResend = async () => {
    setResendState({ sending: true, note: "" });
    try {
      const result = await dispatch(
        resendVerification(formData.email.trim()),
      ).unwrap();
      setResendState({ sending: false, note: result.message });
    } catch (error) {
      setResendState({
        sending: false,
        note: error?.message || "The link could not be sent. Try again.",
      });
    }
  };

  if (isSuccess) {
    return (
      <>
        <div className="login-bg-image"></div>
        <div className="login-bg-overlay"></div>

        <motion.div
          className="login-success"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="success-content"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <FaCheckCircle />
            </motion.div>
            <h1>Welcome Back! 🎉</h1>
            <p>You have successfully logged in. Redirecting...</p>
          </motion.div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <div className="login-bg-image"></div>
      <div className="login-bg-overlay"></div>

      <div className="login-container">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="login-header">
            <motion.div
              className="login-icon-wrapper"
              whileHover={{ rotate: -15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaSignInAlt />
            </motion.div>
            <h1>Sign In</h1>
            <p>Welcome back to FashionStyle</p>
          </div>

          <AnimatePresence>
            {isError && (
              <motion.div
                className={`login-error-banner${
                  needsVerification ? " warning" : ""
                }`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {errorMessage || "Invalid email or password. Please try again."}

                {needsVerification && (
                  <div className="verify-inline-actions">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendState.sending}
                    >
                      {resendState.sending
                        ? "Sending…"
                        : "Resend the confirmation link"}
                    </button>
                    {resendState.note && (
                      <p className="verify-inline-note">{resendState.note}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-grid">
              <div className="login-form-group full-width">
                <label><FaEnvelope /> Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.span className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.email}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="login-form-group full-width">
                <label><FaLock /> Password *</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "error" : ""}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.span className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.password}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="login-form-group full-width login-options-wrapper">
                <div className="terms-wrapper">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <label htmlFor="rememberMe" className="terms-label">
                    Remember me
                  </label>
                </div>
                <a href="#" className="forgot-password-link">Forgot password?</a>
              </div>
            </div>

            <motion.button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <motion.div
                  className="loader"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  Sign In <FaArrowRight />
                </>
              )}
            </motion.button>

            <GoogleAuthButton text="continue_with" disabled={isLoading} />

            <div className="login-security-badge">
              <FaShieldAlt />
              <p>Your data is protected with 256-bit SSL encryption</p>
            </div>
          </form>

          <div className="login-footer">
            <p>Don't have an account?</p>
            <motion.button
              className="register-redirect-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/register")}
            >
              Create Account
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
