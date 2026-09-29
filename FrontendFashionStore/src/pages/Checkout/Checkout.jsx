import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQuantity, clearCart } from "./cartSlice";
import { setRedirectTo } from "../Auth/authSlice";
import { placeOrder as placeOrderRequest } from "../../features/orders/ordersSlice";
import {
  FaShoppingBag,
  FaUser,
  FaMapMarkerAlt,
  FaCreditCard,
  FaLock,
  FaCheckCircle,
  FaChevronRight,
  FaChevronLeft,
  FaTruck,
  FaGift,
  FaTag,
  FaTrash,
  FaEdit,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaCity,
  FaGlobe,
  FaMoneyBillWave,
  FaPaypal,
  FaCcVisa,
  FaCcMastercard,
  FaApplePay,
  FaGooglePay,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./Checkout.css";

const PROMO_CODES = {
  SAVE10: 10,
  SAVE20: 20,
  FASHION50: 50,
  WELCOME15: 15,
};

const INITIAL_SHIPPING = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  zipCode: "",
  country: "USA",
};

const STEPS = [
  { number: 1, title: "Shipping", icon: <FaTruck /> },
  { number: 2, title: "Delivery", icon: <FaMapMarkerAlt /> },
  { number: 3, title: "Payment", icon: <FaCreditCard /> },
  { number: 4, title: "Review", icon: <FaCheckCircle /> },
];

const saveOrderToLocalStorage = (order) => {
  try {
    const orders = JSON.parse(localStorage.getItem("userOrders") || "[]");
    orders.unshift(order);
    localStorage.setItem("userOrders", JSON.stringify(orders.slice(0, 50)));
  } catch (error) {
    console.error("Error saving order to localStorage:", error);
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart?.items || []);
  const isAuthenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated));
  const user = useSelector((state) => state.auth?.user || null);

  const [currentStep, setCurrentStep] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ type: "", text: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errors, setErrors] = useState({});
  const [shippingInfo, setShippingInfo] = useState(INITIAL_SHIPPING);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [completedOrder, setCompletedOrder] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const hasPrefilledUser = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || hasPrefilledUser.current) return;

    const fallback = (user.name || "").trim().split(" ");
    const firstName = user.firstName || fallback[0] || "";
    const lastName = user.lastName || fallback.slice(1).join(" ") || "";

    setShippingInfo((prev) => {
      const needsUpdate =
        !prev.email || !prev.firstName || !prev.lastName || !prev.phone;
      if (!needsUpdate) return prev;

      hasPrefilledUser.current = true;
      return {
        ...prev,
        email: prev.email || user.email || "",
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        phone: prev.phone || user.phone || "",
      };
    });
  }, [isAuthenticated, user]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return sum + price * quantity;
    }, 0);
  }, [cart]);

  const shippingCost = useMemo(() => {
    if (shippingMethod === "express") return 15;
    if (shippingMethod === "standard") return 5;
    return 0;
  }, [shippingMethod]);

  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => Math.max(0, subtotal + shippingCost + tax - discount), [subtotal, shippingCost, tax, discount]);

  const updateShipping = useCallback((field, value) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const applyPromoCode = useCallback(() => {
    const code = (promoCode || "").trim().toUpperCase();

    if (!code) {
      setPromoMessage({ type: "error", text: "Please enter a promo code" });
      return;
    }

    if (PROMO_CODES[code]) {
      setDiscount(PROMO_CODES[code]);
      setPromoCode(code);
      setPromoMessage({ type: "success", text: `Code applied! $${PROMO_CODES[code]} discount` });
    } else {
      setDiscount(0);
      setPromoMessage({ type: "error", text: "Invalid promo code" });
    }
  }, [promoCode]);

  const handleRemoveFromCart = useCallback((id, size, color) => {
    dispatch(removeFromCart({ id, size, color }));
  }, [dispatch]);

  const handleUpdateQuantity = useCallback((id, size, color, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ id, size, color, quantity: newQuantity }));
  }, [dispatch]);

  const validateStep = useCallback((step) => {
    const newErrors = {};

    if (step === 1) {
      if (!(shippingInfo.firstName || "").trim()) newErrors.firstName = "First name is required";
      if (!(shippingInfo.lastName || "").trim()) newErrors.lastName = "Last name is required";
      if (!(shippingInfo.email || "").trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
        newErrors.email = "Valid email is required";
      }
      if (!(shippingInfo.phone || "").trim() || (shippingInfo.phone || "").replace(/\D/g, "").length < 10) {
        newErrors.phone = "Valid phone number is required";
      }
      if (!(shippingInfo.address || "").trim()) newErrors.address = "Address is required";
      if (!(shippingInfo.city || "").trim()) newErrors.city = "City is required";
      if (!(shippingInfo.zipCode || "").trim()) newErrors.zipCode = "ZIP code is required";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [shippingInfo]);

  const nextStep = useCallback(() => {
    if (currentStep === 3 && !isAuthenticated) {
      setShowAuthModal(true);
      dispatch(setRedirectTo("/checkout?step=4"));
      return;
    }

    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  }, [currentStep, isAuthenticated, validateStep, dispatch]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const placeOrder = useCallback(async () => {
    if (isPlacingOrder || isProcessingPayment) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      dispatch(setRedirectTo("/checkout?step=4"));
      return;
    }

    if (!validateStep(3)) {
      setCurrentStep(3);
      return;
    }

    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const generatedOrderNumber = `ORD-${timestamp}-${randomPart}`;
    const finalTotal = total;

    setOrderError(null);
    setIsPlacingOrder(true);
    setIsProcessingPayment(true);

    const orderData = {
      orderNumber: generatedOrderNumber,
      orderDate: new Date().toISOString(),
      status: "Processing",
      customer: {
        name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
      },
      shippingAddress: {
        ...shippingInfo,
      },
      deliveryMethod: {
        type: shippingMethod,
        label: shippingMethod === "express"
          ? "Express Delivery"
          : shippingMethod === "standard"
          ? "Standard Delivery"
          : "Free Delivery",
        cost: shippingCost,
        estimate: shippingMethod === "express"
          ? "1-2 days"
          : shippingMethod === "standard"
          ? "3-5 days"
          : "7-10 days",
      },
      paymentMethod: {
        type: paymentMethod,
      },
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        size: item.size,
        color: item.color,
        total: (Number(item.price) || 0) * (Number(item.quantity) || 0),
      })),
      pricing: {
        subtotal: subtotal,
        shipping: shippingCost,
        tax: tax,
        discount: discount,
        total: finalTotal,
      },
      isGift: isGift,
      promoCode: discount > 0 ? promoCode : null,
    };

    let confirmedOrder = orderData;
    let checkoutUrl = null;

    try {
      const result = await dispatch(
        placeOrderRequest({
          cart,
          shippingInfo,
          shippingMethod,
          paymentMethod,
          total: finalTotal,
          promoCode: discount > 0 ? promoCode : null,
          isGift,
        }),
      ).unwrap();

      confirmedOrder = {
        ...orderData,
        orderNumber: result.order.orderNumber || generatedOrderNumber,
        orderId: result.order.id,
        status: result.order.isPaid ? "Paid" : "Processing",
        pricing: {
          ...orderData.pricing,
          total: Number(result.order.totalPrice) || finalTotal,
        },
      };
      checkoutUrl = result.checkoutUrl;
    } catch (apiError) {
      setOrderError(
        typeof apiError === "string"
          ? apiError
          : "La commande n'a pas pu être transmise au serveur. Elle a été enregistrée localement.",
      );
    }

    saveOrderToLocalStorage(confirmedOrder);

    if (checkoutUrl) {
      dispatch(clearCart());
      window.location.assign(checkoutUrl);
      return;
    }

    setCompletedOrder(confirmedOrder);

    setOrderNumber(confirmedOrder.orderNumber);
    setOrderTotal(confirmedOrder.pricing?.total ?? finalTotal);

    dispatch(clearCart());

    setIsProcessingPayment(false);
    setIsPlacingOrder(false);
    setShowSuccess(true);

    setShippingInfo(INITIAL_SHIPPING);
    setPromoCode("");
    setDiscount(0);
    setCurrentStep(1);
  }, [
    isPlacingOrder,
    isProcessingPayment,
    isAuthenticated,
    total,
    validateStep,
    dispatch,
    cart,
    shippingInfo,
    shippingMethod,
    shippingCost,
    paymentMethod,
    subtotal,
    tax,
    discount,
    isGift,
    promoCode
  ]);

  const handleLoginRedirect = useCallback(() => {
    dispatch(setRedirectTo("/checkout?step=4"));
    navigate("/login");
  }, [dispatch, navigate]);

  const handleRegisterRedirect = useCallback(() => {
    dispatch(setRedirectTo("/checkout?step=4"));
    navigate("/register");
  }, [dispatch, navigate]);

  const deliveryLabel =
    shippingMethod === "express"
      ? "Express Delivery"
      : shippingMethod === "standard"
      ? "Standard Delivery"
      : "Free Delivery";

  const deliveryEstimate =
    shippingMethod === "express"
      ? "1-2 days"
      : shippingMethod === "standard"
      ? "3-5 days"
      : "7-10 days";

  if (showSuccess && completedOrder) {
    return (
      <>
        <div className="checkout-bg-image"></div>
        <div className="checkout-bg-overlay"></div>
        <motion.div
          className="checkout-success"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="success-content" initial={{ y: 50 }} animate={{ y: 0 }} transition={{ delay: 0.2 }}>
            <motion.div
              className="success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <FaCheckCircle />
            </motion.div>
            <h1>Order Placed Successfully! 🎉</h1>
            <p>Thank you for your purchase, {completedOrder.customer.name}. Your order is being processed.</p>

            {orderError && (
              <p className="checkout-order-warning" role="alert">
                <FaExclamationTriangle /> {orderError}
              </p>
            )}

            <div className="success-details">
              <div className="detail-item">
                <span>Order Number:</span>
                <strong>#{orderNumber}</strong>
              </div>
              <div className="detail-item">
                <span>Total Amount:</span>
                <strong>${orderTotal.toFixed(2)}</strong>
              </div>
              <div className="detail-item">
                <span>Estimated Delivery:</span>
                <strong>{completedOrder.deliveryMethod.estimate}</strong>
              </div>
              <div className="detail-item">
                <span>Items Ordered:</span>
                <strong>{completedOrder.items.length} item(s)</strong>
              </div>
            </div>

            <motion.div
              className="success-items"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3>Order Summary</h3>
              <div className="success-items-list">
                {completedOrder.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="success-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <img src={item.image} alt={item.name} />
                    <div className="success-item-info">
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      {item.size && <p>Size: {item.size}</p>}
                      {item.color && <p>Color: {item.color}</p>}
                    </div>
                    <div className="success-item-price">
                      ${item.total.toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="success-actions">
              <motion.button
                type="button"
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSuccess(false);
                  setCompletedOrder(null);
                  navigate("/");
                }}
              >
                Continue Shopping
              </motion.button>
              <motion.button
                type="button"
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/orders")}
              >
                View Orders
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <>
        <div className="checkout-bg-image"></div>
        <div className="checkout-bg-overlay"></div>
        <motion.div className="empty-checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <FaShoppingBag className="empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Add some items to proceed with checkout</p>
          <motion.button
            type="button"
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </motion.button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <div className="checkout-bg-image"></div>
      <div className="checkout-bg-overlay"></div>

      <AnimatePresence>
        {isProcessingPayment && (
          <motion.div
            className="processing-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="processing-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="processing-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FaLock />
              </motion.div>
              <h3>Processing Your Payment</h3>
              <p>Please wait while we securely process your order...</p>
              <div className="processing-steps">
                <motion.div
                  className="processing-step"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <FaCheckCircle /> Validating payment information
                </motion.div>
                <motion.div
                  className="processing-step"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, repeat: Infinity, repeatType: "reverse" }}
                >
                  <FaCheckCircle /> Confirming order details
                </motion.div>
                <motion.div
                  className="processing-step"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6, repeat: Infinity, repeatType: "reverse" }}
                >
                  <FaCheckCircle /> Preparing your order
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            className="auth-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              className="auth-modal-content"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="auth-modal-icon">
                <FaExclamationTriangle />
              </div>
              <h2>Authentication Required</h2>
              <p>You need to be logged in to complete your order. Please sign in or create an account to continue.</p>

              <div className="auth-modal-actions">
                <motion.button
                  type="button"
                  className="auth-modal-btn primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoginRedirect}
                >
                  <FaUser /> Sign In
                </motion.button>

                <motion.button
                  type="button"
                  className="auth-modal-btn secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegisterRedirect}
                >
                  Create Account
                </motion.button>
              </div>

              <motion.button
                type="button"
                className="auth-modal-close"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAuthModal(false)}
              >
                ✕
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="checkout-container">
        <div className="checkout-stepper">
          {STEPS.map((step, index) => (
            <div key={step.number} className="stepper-item-wrapper">
              <motion.div
                className={`stepper-item ${currentStep >= step.number ? "active" : ""} ${
                  currentStep > step.number ? "completed" : ""
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="stepper-icon">{step.icon}</div>
                <span className="stepper-title">{step.title}</span>
              </motion.div>
              {index < STEPS.length - 1 && (
                <div className={`stepper-line ${currentStep > step.number ? "completed" : ""}`} />
              )}
            </div>
          ))}
        </div>

        <div className="checkout-content">
          <div className="checkout-left">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  className="checkout-section"
                  key="step1"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <FaUser className="section-icon" />
                    <h2>Shipping Information</h2>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={shippingInfo.firstName}
                        onChange={(e) => updateShipping("firstName", e.target.value)}
                        className={errors.firstName ? "error" : ""}
                      />
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={shippingInfo.lastName}
                        onChange={(e) => updateShipping("lastName", e.target.value)}
                        className={errors.lastName ? "error" : ""}
                      />
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        <FaEnvelope /> Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={shippingInfo.email}
                        onChange={(e) => updateShipping("email", e.target.value)}
                        className={errors.email ? "error" : ""}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">
                        <FaPhone /> Phone *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={shippingInfo.phone}
                        onChange={(e) => updateShipping("phone", e.target.value)}
                        className={errors.phone ? "error" : ""}
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="address">
                        <FaHome /> Street Address *
                      </label>
                      <input
                        id="address"
                        type="text"
                        placeholder="123 Main Street"
                        value={shippingInfo.address}
                        onChange={(e) => updateShipping("address", e.target.value)}
                        className={errors.address ? "error" : ""}
                      />
                      {errors.address && <span className="error-message">{errors.address}</span>}
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="apartment">Apartment, suite, etc. (optional)</label>
                      <input
                        id="apartment"
                        type="text"
                        placeholder="Apt 4B"
                        value={shippingInfo.apartment}
                        onChange={(e) => updateShipping("apartment", e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="city">
                        <FaCity /> City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        placeholder="New York"
                        value={shippingInfo.city}
                        onChange={(e) => updateShipping("city", e.target.value)}
                        className={errors.city ? "error" : ""}
                      />
                      {errors.city && <span className="error-message">{errors.city}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="state">State / Province</label>
                      <input
                        id="state"
                        type="text"
                        placeholder="NY"
                        value={shippingInfo.state}
                        onChange={(e) => updateShipping("state", e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP / Postal Code *</label>
                      <input
                        id="zipCode"
                        type="text"
                        placeholder="10001"
                        value={shippingInfo.zipCode}
                        onChange={(e) => updateShipping("zipCode", e.target.value)}
                        className={errors.zipCode ? "error" : ""}
                      />
                      {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="country">
                        <FaGlobe /> Country *
                      </label>
                      <select
                        id="country"
                        value={shippingInfo.country}
                        onChange={(e) => updateShipping("country", e.target.value)}
                      >
                        <option value="USA">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="France">France</option>
                        <option value="Germany">Germany</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  className="checkout-section"
                  key="step2"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <FaTruck className="section-icon" />
                    <h2>Delivery Method</h2>
                  </div>

                  <div className="delivery-options">
                    {[
                      { id: "standard", label: "Standard Delivery", price: "$5.00", time: "3-5 business days" },
                      { id: "express", label: "Express Delivery", price: "$15.00", time: "1-2 business days" },
                      { id: "free", label: "Free Delivery", price: "FREE", time: "7-10 business days", isFree: true },
                    ].map((option) => (
                      <motion.div
                        key={option.id}
                        className={`delivery-option ${shippingMethod === option.id ? "selected" : ""}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShippingMethod(option.id)}
                      >
                        <div className="delivery-radio">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === option.id}
                            onChange={() => setShippingMethod(option.id)}
                          />
                        </div>
                        <div className="delivery-info">
                          <div className="delivery-header">
                            <h3>{option.label}</h3>
                            <span className={`delivery-price ${option.isFree ? "free" : ""}`}>{option.price}</span>
                          </div>
                          <p>Delivery in {option.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="gift-option">
                    <FaGift className="gift-icon" />
                    <div className="gift-content">
                      <h3>Send as a Gift</h3>
                      <p>Add a personalized message and gift wrapping</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  className="checkout-section"
                  key="step3"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <FaCreditCard className="section-icon" />
                    <h2>Payment Method</h2>
                  </div>

                  <div className="payment-methods">
                    {[
                      {
                        id: "card",
                        label: "Credit / Debit Card",
                        icon: <FaCreditCard />,
                        logos: [<FaCcVisa key="visa" />, <FaCcMastercard key="mc" />],
                      },
                      { id: "paypal", label: "PayPal", icon: <FaPaypal className="payment-icon paypal" /> },
                      { id: "apple", label: "Apple Pay", icon: <FaApplePay className="payment-icon apple" /> },
                      { id: "google", label: "Google Pay", icon: <FaGooglePay className="payment-icon google" /> },
                      { id: "cash", label: "Cash on Delivery", icon: <FaMoneyBillWave className="payment-icon cash" /> },
                    ].map((method) => (
                      <motion.div
                        key={method.id}
                        className={`payment-method ${paymentMethod === method.id ? "selected" : ""}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <div className="payment-radio">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === method.id}
                            onChange={() => setPaymentMethod(method.id)}
                          />
                        </div>
                        <div className="payment-info">
                          {method.icon}
                          <span>{method.label}</span>
                        </div>
                        {method.logos && <div className="payment-logos">{method.logos}</div>}
                      </motion.div>
                    ))}
                  </div>

                  {paymentMethod !== "cash" && (
                    <motion.div className="card-details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="secure-payment-note">
                        <FaLock /> You will enter your payment details on Stripe&apos;s secure page
                        after clicking <strong>Place Order</strong>. Your card number never
                        passes through FashionStore.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  className="checkout-section"
                  key="step4"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="section-header">
                    <FaCheckCircle className="section-icon" />
                    <h2>Review Your Order</h2>
                  </div>

                  <div className="review-sections">
                    <div className="review-card">
                      <div className="review-header">
                        <h3>
                          <FaMapMarkerAlt /> Shipping Address
                        </h3>
                        <button type="button" className="edit-btn" onClick={() => setCurrentStep(1)}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className="review-content">
                        <p>
                          {shippingInfo.firstName} {shippingInfo.lastName}
                        </p>
                        <p>{shippingInfo.address}</p>
                        {shippingInfo.apartment && <p>{shippingInfo.apartment}</p>}
                        <p>
                          {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                        </p>
                        <p>{shippingInfo.country}</p>
                        <p className="contact-info">
                          <FaEnvelope /> {shippingInfo.email}
                        </p>
                        <p className="contact-info">
                          <FaPhone /> {shippingInfo.phone}
                        </p>
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-header">
                        <h3>
                          <FaTruck /> Delivery Method
                        </h3>
                        <button type="button" className="edit-btn" onClick={() => setCurrentStep(2)}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className="review-content">
                        <p>
                          <strong>{deliveryLabel}</strong>
                        </p>
                        <p>Estimated delivery: {deliveryEstimate}</p>
                        {isGift && <p>🎁 Gift wrapping requested</p>}
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-header">
                        <h3>
                          <FaCreditCard /> Payment Method
                        </h3>
                        <button type="button" className="edit-btn" onClick={() => setCurrentStep(3)}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className="review-content">
                        {paymentMethod === "card" && (
                          <>
                            <p>
                              <strong>Credit/Debit Card</strong>
                            </p>
                            <p>Secure payment on Stripe after you place the order</p>
                          </>
                        )}
                        {paymentMethod === "paypal" && <p><strong>PayPal</strong></p>}
                        {paymentMethod === "apple" && <p><strong>Apple Pay</strong></p>}
                        {paymentMethod === "google" && <p><strong>Google Pay</strong></p>}
                        {paymentMethod === "cash" && <p><strong>Cash on Delivery</strong></p>}
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-header">
                        <h3>
                          <FaShoppingBag /> Order Items ({cart.length})
                        </h3>
                      </div>
                      <div className="review-items">
                        {cart.map((item) => (
                          <div key={`${item?.id}-${item?.size}-${item?.color}`} className="review-item">
                            <img src={item?.image} alt={item?.name} />
                            <div className="review-item-details">
                              <h4>{item?.name}</h4>
                              <p>Quantity: {item?.quantity}</p>
                              {item?.size && <p>Size: {item.size}</p>}
                              {item?.color && <p>Color: {item.color}</p>}
                            </div>
                            <div className="review-item-price">
                              ${((Number(item?.price) || 0) * (Number(item?.quantity) || 0)).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="checkout-actions">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  className="btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStep}
                  disabled={isProcessingPayment}
                >
                  <FaChevronLeft /> Back
                </motion.button>
              )}

              {currentStep < 4 ? (
                <motion.button
                  type="button"
                  className="btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  disabled={isProcessingPayment}
                >
                  Continue <FaChevronRight />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  className="btn-complete"
                  whileHover={{ scale: isPlacingOrder ? 1 : 1.05 }}
                  whileTap={{ scale: isPlacingOrder ? 1 : 0.95 }}
                  onClick={placeOrder}
                  disabled={isPlacingOrder || isProcessingPayment}
                >
                  <FaLock /> {isPlacingOrder ? "Processing..." : "Place Order"}
                </motion.button>
              )}
            </div>
          </div>

          <div className="checkout-right">
            <motion.div
              className="order-summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3>Order Summary</h3>

                      <div className="summary-items">
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.div
                      key={`${item?.id}-${item?.size}-${item?.color}`}
                      className="summary-item"
                      initial={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img src={item?.image} alt={item?.name} />
                      <div className="summary-item-info">
                        <h4>{item?.name}</h4>
                        <p>Qty: {item?.quantity}</p>
                        <div className="item-actions">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item?.id, item?.size, item?.color, (item?.quantity || 0) - 1)}
                            disabled={isProcessingPayment}
                          >
                            -
                          </button>
                          <span>{item?.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item?.id, item?.size, item?.color, (item?.quantity || 0) + 1)}
                            disabled={isProcessingPayment}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => handleRemoveFromCart(item?.id, item?.size, item?.color)}
                            disabled={isProcessingPayment}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <div className="summary-item-price">
                        ${((Number(item?.price) || 0) * (Number(item?.quantity) || 0)).toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="promo-code">
                <div className="promo-input-wrapper">
                  <FaTag className="promo-icon" />
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode((e.target.value || "").toUpperCase());
                      setPromoMessage({ type: "", text: "" });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyPromoCode();
                    }}
                    disabled={isProcessingPayment}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={applyPromoCode}
                    disabled={isProcessingPayment}
                  >
                    Apply
                  </motion.button>
                </div>
                {promoMessage.text && (
                  <motion.div
                    className={promoMessage.type === "success" ? "promo-applied" : "error-message"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {promoMessage.type === "success" && <FaCheckCircle />} {promoMessage.text}
                  </motion.div>
                )}
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="price-row">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="price-row">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="price-row discount">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="price-row total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="security-badge">
                <FaLock />
                <p>Secure checkout powered by SSL encryption</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
