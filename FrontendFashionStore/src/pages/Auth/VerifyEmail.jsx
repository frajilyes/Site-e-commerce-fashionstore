import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  verifyEmail,
  resendVerification,
  clearRedirectTo,
  clearPendingVerification,
} from "./authSlice";
import {
  FaEnvelopeOpenText,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEnvelope,
  FaArrowRight,
} from "react-icons/fa";
import "./VerifyEmail.css";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { redirectTo, pendingVerificationEmail } = useSelector(
    (state) => state.auth,
  );

  const [status, setStatus] = useState(token ? "verifying" : "missing");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(pendingVerificationEmail || "");
  const [resendState, setResendState] = useState({ sending: false, note: "" });

  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    dispatch(verifyEmail(token))
      .unwrap()
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setMessage(error?.message || "This confirmation link is not valid.");
      });
  }, [dispatch, token]);

  useEffect(() => {
    if (status !== "success") return;

    const timer = setTimeout(() => {
      dispatch(clearPendingVerification());
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        dispatch(clearRedirectTo());
      } else {
        navigate("/", { replace: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [status, redirectTo, navigate, dispatch]);

  const handleResend = useCallback(
    async (e) => {
      e.preventDefault();
      if (!email.trim()) return;

      setResendState({ sending: true, note: "" });
      try {
        const result = await dispatch(resendVerification(email.trim())).unwrap();
        setResendState({ sending: false, note: result.message });
      } catch (error) {
        setResendState({
          sending: false,
          note: error?.message || "The link could not be sent. Try again.",
        });
      }
    },
    [dispatch, email],
  );

  const resendForm = (
    <form onSubmit={handleResend} className="verify-resend-form">
      <label htmlFor="verify-email-input">
        <FaEnvelope /> Email address
      </label>
      <input
        id="verify-email-input"
        type="email"
        placeholder="john.doe@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <motion.button
        type="submit"
        className="verify-btn"
        disabled={resendState.sending || !email.trim()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {resendState.sending ? "Sending…" : "Send a new link"}
      </motion.button>
      {resendState.note && <p className="verify-note">{resendState.note}</p>}
    </form>
  );

  const screens = {
    verifying: {
      icon: <FaEnvelopeOpenText />,
      tone: "neutral",
      title: "Confirming your email",
      text: "One moment, we are activating your account…",
      body: <div className="verify-loader" />,
    },
    success: {
      icon: <FaCheckCircle />,
      tone: "success",
      title: "Email confirmed 🎉",
      text: "Your account is active and you are now signed in. Redirecting…",
      body: null,
    },
    error: {
      icon: <FaExclamationTriangle />,
      tone: "error",
      title: "This link is no longer valid",
      text: message,
      body: resendForm,
    },
    missing: {
      icon: <FaExclamationTriangle />,
      tone: "error",
      title: "Confirmation link missing",
      text: "Open the link from the email we sent you, or request a new one below.",
      body: resendForm,
    },
  };

  const screen = screens[status];

  return (
    <>
      <div className="verify-bg-image"></div>
      <div className="verify-bg-overlay"></div>

      <div className="verify-container">
        <motion.div
          className="verify-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className={`verify-icon-wrapper ${screen.tone}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          >
            {screen.icon}
          </motion.div>

          <h1>{screen.title}</h1>
          <p className="verify-text">{screen.text}</p>

          {screen.body}

          {status !== "verifying" && status !== "success" && (
            <div className="verify-footer">
              <Link to="/login">
                Back to sign in <FaArrowRight />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default VerifyEmail;
