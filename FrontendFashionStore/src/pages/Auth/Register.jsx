import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { registerUser, resendVerification, resetAuthState } from "./authSlice";
import {
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaEnvelopeOpenText,
} from "react-icons/fa";
import GoogleAuthButton from "../../components/GoogleAuthButton/GoogleAuthButton";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, isSuccess, isError, errorMessage, pendingVerificationEmail } =
    useSelector((state) => state.auth);

  const [resendState, setResendState] = useState({ sending: false, note: "" });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Valid phone number is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.terms) {
      newErrors.terms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(registerUser(formData));
    }
  };

  useEffect(() => {
    if (isError) {
      alert(errorMessage || "Registration failed. Please try again.");
      dispatch(resetAuthState());
    }
  }, [isError, errorMessage, dispatch]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendState({ sending: true, note: "" });
    try {
      const result = await dispatch(
        resendVerification(pendingVerificationEmail),
      ).unwrap();
      setResendState({ sending: false, note: result.message });
    } catch (error) {
      setResendState({
        sending: false,
        note: error?.message || "The link could not be sent. Try again.",
      });
    }
  };

  if (isSuccess && pendingVerificationEmail) {
    return (
      <>
        <div className="register-bg-image"></div>
        <div className="register-bg-overlay"></div>

        <motion.div
          className="register-success"
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
              <FaEnvelopeOpenText />
            </motion.div>
            <h1>Check your inbox 📬</h1>
            <p>
              We sent a confirmation link to{" "}
              <strong>{pendingVerificationEmail}</strong>. Open it to activate
              your account — the link is valid for 24 hours.
            </p>

            <div className="success-actions">
              <button
                type="button"
                className="resend-btn"
                onClick={handleResend}
                disabled={resendState.sending}
              >
                {resendState.sending ? "Sending…" : "Resend the link"}
              </button>
              <button
                type="button"
                className="login-redirect-btn"
                onClick={() => {
                  dispatch(resetAuthState());
                  navigate("/login");
                }}
              >
                Go to sign in
              </button>
            </div>

            {resendState.note && (
              <p className="resend-note">{resendState.note}</p>
            )}
          </motion.div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <div className="register-bg-image"></div>
      <div className="register-bg-overlay"></div>

      <div className="register-container">
        <motion.div
          className="register-card"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="register-header">
            <motion.div
              className="register-icon-wrapper"
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaUserPlus />
            </motion.div>
            <h1>Create Account</h1>
            <p>Join the FashionStyle community today</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-form-grid">
              <div className="register-form-group">
                <label><FaUser /> First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? "error" : ""}
                />
                <AnimatePresence>
                  {errors.firstName && (
                    <motion.span className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.firstName}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="register-form-group">
                <label><FaUser /> Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? "error" : ""}
                />
                <AnimatePresence>
                  {errors.lastName && (
                    <motion.span className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.lastName}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="register-form-group full-width">
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

              <div className="register-form-group full-width">
                <label><FaPhone /> Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? "error" : ""}
                />
                <AnimatePresence>
                  {errors.phone && (
                    <motion.span className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.phone}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="register-form-group full-width">
                <label><FaLock /> Password *</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Minimum 8 characters"
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

              <div className="register-form-group full-width">
                <label><FaLock /> Confirm Password *</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? "error" : ""}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.span className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.confirmPassword}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="register-form-group full-width">
                <div className="terms-wrapper">
                  <input
                    type="checkbox"
                    name="terms"
                    id="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className={errors.terms ? "error-check" : ""}
                  />
                  <label htmlFor="terms" className="terms-label">
                    I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                  </label>
                </div>
                <AnimatePresence>
                  {errors.terms && (
                    <motion.span className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {errors.terms}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.button
              type="submit"
              className="register-submit-btn"
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
                  Create Account <FaArrowRight />
                </>
              )}
            </motion.button>

            <GoogleAuthButton text="continue_with" disabled={isLoading} />

            <div className="register-security-badge">
              <FaShieldAlt />
              <p>Your data is protected with 256-bit SSL encryption</p>
            </div>
          </form>

          <div className="register-footer">
            <p>Already have an account?</p>
            <motion.button
              className="login-redirect-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
            >
              Sign In
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Register;
