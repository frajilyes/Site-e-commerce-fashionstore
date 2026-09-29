import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane,
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaCheckCircle, FaExclamationCircle, FaClock, FaUser,
  FaRegComments, FaHeadset, FaExclamationTriangle,
  FaHome, FaSearch, FaLifeRing, FaQuestionCircle,
} from "react-icons/fa";
import "./Contact.css";

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x1: Math.random() * 100,
  x2: Math.random() * 100,
  size: 2 + Math.random() * 4,
  dur: 15 + Math.random() * 15,
  delay: Math.random() * 10,
  opacity: 0.2 + Math.random() * 0.4,
}));

const CONTACT_INFO = [
  { icon: FaPhone, title: "Call Us", info: "+1 (555) 123-4567", subInfo: "Mon-Fri 9am-6pm EST", link: "tel:+15551234567", color: "#00ff88" },
  { icon: FaEnvelope, title: "Email Us", info: "support@fashionstore.com", subInfo: "24/7 Support", link: "mailto:support@fashionstore.com", color: "#667eea" },
  { icon: FaMapMarkerAlt, title: "Visit Us", info: "123 Fashion Avenue, NY 10001", subInfo: "New York, USA", link: "https://maps.google.com", color: "#ff6b6b" },
];

const SOCIAL_LINKS = [
  { icon: FaFacebookF,  url: "https://facebook.com",  color: "#1877f2", label: "Facebook"  },
  { icon: FaTwitter,    url: "https://twitter.com",   color: "#1da1f2", label: "Twitter"   },
  { icon: FaInstagram,  url: "https://instagram.com", color: "#e4405f", label: "Instagram" },
  { icon: FaLinkedinIn, url: "https://linkedin.com",  color: "#0077b5", label: "LinkedIn"  },
];

const SUBJECT_OPTIONS = [
  { value: "general",  label: "General Inquiry",    icon: FaQuestionCircle    },
  { value: "support",  label: "Technical Support",  icon: FaHeadset           },
  { value: "404",      label: "Report 404 Error",   icon: FaExclamationTriangle },
  { value: "order",    label: "Order Issue",         icon: FaLifeRing          },
  { value: "feedback", label: "Feedback",            icon: FaRegComments       },
];

const VARIANTS = {
  fadeInUp: {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  },
  errorBanner: {
    hidden:  { opacity: 0, y: -30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  },
  fieldError: {
    hidden:  { opacity: 0, y: -4, height: 0 },
    visible: { opacity: 1, y:  0, height: "auto", transition: { duration: 0.2 } },
    exit:    { opacity: 0, y: -4, height: 0,      transition: { duration: 0.15 } },
  },
  toast: {
    hidden:  { opacity: 0, y: -50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit:    { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.2 } },
  },
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAP_STYLE   = { border: 0, borderRadius: "18px" };

const buildInitialForm = (is404, pathname) => ({
  name:    "",
  email:   "",
  subject: is404 ? "404" : "general",
  message: is404
    ? `I encountered a 404 error while trying to access: ${pathname}`
    : "",
});

const getValidationErrors = (formData) => {
  const errs = {};
  if (!formData.name.trim())
    errs.name = "Name is required";
  if (!formData.email.trim())
    errs.email = "Email is required";
  else if (!EMAIL_REGEX.test(formData.email.trim()))
    errs.email = "Invalid email format";
  if (!formData.subject)
    errs.subject = "Please select a subject";
  if (!formData.message.trim())
    errs.message = "Message is required";
  else if (formData.message.trim().length < 10)
    errs.message = "Message must be at least 10 characters";
  return errs;
};

const sendContactForm = async (data) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    void data;
  } catch (apiError) {
    console.error("[sendContactForm] Network error:", apiError);
    throw apiError;
  }
};

const ParticleField = () => (
  <>
    {PARTICLES.map((p) => (
      <motion.div
        key={p.id}
        className="cu-particle"
        aria-hidden="true"
        initial={{ y: "-10%", x: `${p.x1}%` }}
        animate={{ y: ["-10%", "110%"], x: [`${p.x1}%`, `${p.x2}%`] }}
        transition={{ duration: p.dur, repeat: Infinity, ease: "linear", delay: p.delay }}
        style={{ left: 0, top: 0, width: p.size, height: p.size, opacity: p.opacity }}
      />
    ))}
  </>
);

const FieldError = ({ id, message }) => (
  <AnimatePresence>
    {message && (
      <motion.span
        className="cu-error"
        id={id}
        role="alert"
        variants={VARIANTS.fieldError}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ display: "block", overflow: "hidden" }}
      >
        <FaExclamationCircle aria-hidden="true" style={{ marginRight: 4 }} />
        {message}
      </motion.span>
    )}
  </AnimatePresence>
);

const ContactInfoCards = () => (
  <section className="cu-info-section" aria-label="Contact information">
    <div className="cu-container">
      <div className="cu-info-grid">
        {CONTACT_INFO.map((item, index) => {
          const Icon = item.icon;
          const isExternal = item.link.startsWith("http");
          return (
            <motion.a
              key={item.title}
              href={item.link}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="cu-info-card"
              custom={index}
              variants={VARIANTS.fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{ "--card-color": item.color }}
            >
              <div className="cu-info-icon"><Icon aria-hidden="true" /></div>
              <h3>{item.title}</h3>
              <p className="cu-info-main">{item.info}</p>
              <p className="cu-info-sub">{item.subInfo}</p>
            </motion.a>
          );
        })}
      </div>
    </div>
  </section>
);

const SocialBox = () => (
  <div className="cu-social-box">
    <h3>Follow Us</h3>
    <div className="cu-social-links">
      {SOCIAL_LINKS.map((s) => {
        const Icon = s.icon;
        return (
          <motion.a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cu-social-link"
            style={{ "--social-color": s.color }}
            whileHover={{ scale: 1.15, y: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Visit our ${s.label} page`}
          >
            <Icon aria-hidden="true" />
          </motion.a>
        );
      })}
    </div>
    <p className="cu-social-text">
      Stay connected with us on social media for the latest updates and offers.
    </p>
  </div>
);

const QuickLinks = () => (
  <div className="cu-quick-links">
    <h3>Quick Links</h3>
    <div className="cu-links-grid">
      {[
        { href: "/",        Icon: FaHome,           label: "Home"    },
        { href: "/search",  Icon: FaSearch,         label: "Search"  },
        { href: "/support", Icon: FaLifeRing,       label: "Support" },
        { href: "/faq",     Icon: FaQuestionCircle, label: "FAQ"     },
      ].map(({ href, Icon, label }) => (
        <a key={href} href={href} className="cu-quick-link">
          <Icon aria-hidden="true" /> {label}
        </a>
      ))}
    </div>
  </div>
);

const Contact = ({ is404 = false }) => {
  const { pathname } = useLocation();

  const [formData,     setFormData]     = useState(() => buildInitialForm(is404, pathname));
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [notification, setNotification] = useState(null);

  const formRef       = useRef(null);
  const notifTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleSubjectSelect = useCallback((value) => {
    setFormData((prev) => ({ ...prev, subject: value }));
    setErrors((prev) => {
      if (!prev.subject) return prev;
      const next = { ...prev };
      delete next.subject;
      return next;
    });
  }, []);

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const validationErrors = getValidationErrors(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToForm();
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrors({});

    try {
      await sendContactForm(formData);

      setFormData(buildInitialForm(is404, pathname));
      setSubmitStatus("success");
      showNotification("Message sent successfully!", "success");

    } catch {
      setSubmitStatus("error");
      showNotification("Failed to send message. Please try again.", "error");

    } finally {
      setIsSubmitting(false);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setSubmitStatus("idle"), 3000);
    }
  }, [formData, is404, pathname, showNotification, scrollToForm]);

  const submitButtonContent = useMemo(() => {
    if (isSubmitting) {
      return (
        <>
          <motion.span
            className="cu-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ display: "inline-block", marginRight: 8 }}
            aria-hidden="true"
          />
          Sending…
        </>
      );
    }
    if (submitStatus === "success") {
      return <><FaCheckCircle aria-hidden="true" /> Sent!</>;
    }
    if (submitStatus === "error") {
      return <><FaExclamationCircle aria-hidden="true" /> Failed</>;
    }
    return <><FaPaperPlane aria-hidden="true" /> Send Message</>;
  }, [isSubmitting, submitStatus]);

  return (
    <div className="cu-page">

      <AnimatePresence>
        {notification && (
          <motion.div
            className={`cu-notification ${notification.type}`}
            variants={VARIANTS.toast}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {notification.type === "success"
              ? <FaCheckCircle    aria-hidden="true" />
              : <FaExclamationCircle aria-hidden="true" />
            }
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="cu-hero">
        <div className="cu-hero-bg"       aria-hidden="true" />
        <div className="cu-hero-overlay"  aria-hidden="true" />
        <div className="cu-hero-gradient" aria-hidden="true" />
        <div className="cu-glow g1"       aria-hidden="true" />
        <div className="cu-glow g2"       aria-hidden="true" />
        <div className="cu-glow g3"       aria-hidden="true" />
        <ParticleField />

        <div className="cu-hero-content">
          <motion.div
            className="cu-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="cu-tag-dot" aria-hidden="true" />
            {is404 ? "Need Help?" : "We're Here to Help"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {is404 ? (
              <>Page Not Found?<br /><span className="cu-neon">Let&apos;s Help You</span></>
            ) : (
              <>Get in <span className="cu-neon">Touch</span><br />With Us</>
            )}
          </motion.h1>

          <motion.p
            className="cu-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {is404 ? (
              <>
                The page you&apos;re looking for doesn&apos;t exist or has been moved.<br />
                Contact our support team for assistance.
              </>
            ) : (
              <>
                Have questions? We&apos;d love to hear from you.<br />
                Send us a message and we&apos;ll respond as soon as possible.
              </>
            )}
          </motion.p>

          <motion.div
            className="cu-hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="cu-feature"><FaClock       aria-hidden="true" /> 24/7 Support</div>
            <div className="cu-feature"><FaRegComments aria-hidden="true" /> Quick Response</div>
            <div className="cu-feature"><FaUser        aria-hidden="true" /> Expert Team</div>
          </motion.div>

          {is404 && (
            <motion.div
              className="cu-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <motion.button
                className="cu-hero-btn primary"
                type="button"
                onClick={scrollToForm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Contact Support"
              >
                <FaLifeRing aria-hidden="true" /> Contact Support
              </motion.button>
              <motion.a
                href="/"
                className="cu-hero-btn secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Go to Home Page"
              >
                <FaHome aria-hidden="true" /> Go Home
              </motion.a>
            </motion.div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {is404 && (
          <motion.section
            className="cu-error-banner"
            variants={VARIANTS.errorBanner}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="cu-container">
              <div className="cu-error-content">
                <div className="cu-error-icon">
                  <FaExclamationTriangle aria-hidden="true" />
                  <span className="cu-error-code">404</span>
                </div>
                <div className="cu-error-text">
                  <h3>Page Not Found</h3>
                  <p>Attempted URL: <code className="cu-error-url">{pathname}</code></p>
                  <p className="cu-error-help">
                    Don&apos;t worry! Our support team is here to help you find what you&apos;re looking for.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <ContactInfoCards />

      <section className="cu-form-section" ref={formRef} aria-label="Contact form">
        <div className="cu-container">
          <div className="cu-form-grid">

            <motion.div
              className="cu-form-wrap"
              variants={VARIANTS.scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="cu-form-header">
                <h2>{is404 ? "Report an Issue" : "Send us a Message"}</h2>
                <p>
                  {is404
                    ? "Let us know about the error and we'll help you find what you need."
                    : "Fill out the form below and we'll get back to you shortly."}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate autoComplete="on">

                <div className="cu-form-group">
                  <label htmlFor="cu-name">
                    Your Name <span className="cu-required" aria-hidden="true">*</span>
                  </label>
                  <div className="cu-input-wrap">
                    <FaUser className="cu-input-icon" aria-hidden="true" />
                    <input
                      type="text"
                      id="cu-name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={errors.name ? "error" : ""}
                      aria-invalid={errors.name ? "true" : "false"}
                      aria-describedby={errors.name ? "cu-name-error" : undefined}
                      aria-required="true"
                    />
                  </div>
                  <FieldError id="cu-name-error" message={errors.name} />
                </div>

                <div className="cu-form-group">
                  <label htmlFor="cu-email">
                    Email Address <span className="cu-required" aria-hidden="true">*</span>
                  </label>
                  <div className="cu-input-wrap">
                    <FaEnvelope className="cu-input-icon" aria-hidden="true" />
                    <input
                      type="email"
                      id="cu-email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={errors.email ? "error" : ""}
                      aria-invalid={errors.email ? "true" : "false"}
                      aria-describedby={errors.email ? "cu-email-error" : undefined}
                      aria-required="true"
                    />
                  </div>
                  <FieldError id="cu-email-error" message={errors.email} />
                </div>

                <div className="cu-form-group">
                  <p id="cu-subject-label" className="cu-label">
                    Subject <span className="cu-required" aria-hidden="true">*</span>
                  </p>
                  <div
                    className="cu-subject-grid"
                    role="radiogroup"
                    aria-labelledby="cu-subject-label"
                    aria-required="true"
                  >
                    {SUBJECT_OPTIONS.map((option) => {
                      const Icon     = option.icon;
                      const isActive = formData.subject === option.value;
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          role="radio"
                          className={`cu-subject-btn${isActive ? " active" : ""}`}
                          onClick={() => handleSubjectSelect(option.value)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          aria-checked={isActive}
                          aria-label={option.label}
                        >
                          <Icon aria-hidden="true" />
                          <span>{option.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <FieldError id="cu-subject-error" message={errors.subject} />
                </div>

                <div className="cu-form-group">
                  <label htmlFor="cu-message">
                    Message <span className="cu-required" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="cu-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={errors.message ? "error" : ""}
                    placeholder={is404 ? "Describe the error..." : "How can we help?"}
                    aria-invalid={errors.message ? "true" : "false"}
                    aria-describedby={errors.message ? "cu-message-error" : undefined}
                    aria-required="true"
                  />
                  <FieldError id="cu-message-error" message={errors.message} />
                </div>

                <motion.button
                  type="submit"
                  className={`cu-submit-btn${submitStatus !== "idle" ? ` ${submitStatus}` : ""}`}
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  aria-label={
                    isSubmitting            ? "Sending message…" :
                    submitStatus === "success" ? "Message sent"   :
                    submitStatus === "error"   ? "Sending failed" :
                                                "Send message"
                  }
                  aria-busy={isSubmitting}
                >
                  {submitButtonContent}
                </motion.button>

              </form>
            </motion.div>

            <motion.div
              className="cu-map-wrap"
              variants={VARIANTS.scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="cu-map">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9476519598093!2d-73.99185368459418!3d40.74844097932847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={MAP_STYLE}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Our Location - Empire State Building, New York"
                />
              </div>
              <SocialBox />
              {is404 && <QuickLinks />}
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;
