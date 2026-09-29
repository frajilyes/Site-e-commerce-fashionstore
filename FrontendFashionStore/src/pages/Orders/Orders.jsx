import { useEffect } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaReceipt,
  FaTruck,
} from "react-icons/fa";
import { fetchMyOrders } from "../../features/orders/ordersSlice";
import "./Orders.css";

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, status, error } = useSelector((state) => state.orders);

  const [searchParams] = useSearchParams();
  const paymentReturn = searchParams.get("payment");

  useEffect(() => {
    dispatch(fetchMyOrders());

    if (paymentReturn !== "success") return undefined;
    const timers = [3000, 8000].map((delay) =>
      setTimeout(() => dispatch(fetchMyOrders()), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [dispatch, paymentReturn]);

  return (
    <div className="orders-page">
      <div className="orders-bg-overlay" />

      <div className="orders-container">
        <motion.header
          className="orders-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaReceipt className="orders-header-icon" />
          <div>
            <h1>My Orders :</h1>
            <p>Retrouvez ici toutes vos commandes passees sur FashionStore.</p>
          </div>
        </motion.header>

        {paymentReturn === "success" && (
          <div className="orders-state" role="status">
            Paiement recu par Stripe. Votre commande passe en « Payee » des que
            la confirmation arrive (quelques secondes).
          </div>
        )}

        {paymentReturn === "cancelled" && (
          <div className="orders-state orders-state-error" role="status">
            Paiement annule. Votre commande reste en attente de paiement.
          </div>
        )}

        {status === "loading" && (
          <div className="orders-state">Chargement de vos commandes...</div>
        )}

        {status === "failed" && (
          <div className="orders-state orders-state-error">
            {error || "Impossible de charger vos commandes."}
          </div>
        )}

        {status !== "loading" && items.length === 0 && (
          <motion.div
            className="orders-empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <FaBoxOpen className="orders-empty-icon" />
            <h2>Aucune commande pour le moment</h2>
            <p>Vos futurs achats apparaitront sur cette page.</p>
            <button type="button" onClick={() => navigate("/shoplanding")}>
              Decouvrir la boutique
            </button>
          </motion.div>
        )}

        <div className="orders-list">
          {items.map((order, index) => (
            <motion.article
              key={order.id ?? order.orderNumber}
              className="order-card"
              role="button"
              tabIndex={0}
              onClick={() => order.id && navigate(`/orders/${order.id}`)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && order.id) {
                  navigate(`/orders/${order.id}`);
                }
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="order-card-top">
                <div>
                  <span className="order-label">Commande</span>
                  <strong className="order-number">#{order.orderNumber}</strong>
                </div>
                <span
                  className={`order-status ${order.isPaid ? "paid" : "pending"}`}
                >
                  {order.isPaid ? <FaCheckCircle /> : <FaClock />}
                  {order.isPaid ? "Payee" : "En attente de paiement"}
                </span>
              </div>

              <div className="order-card-meta">
                <span>{formatDate(order.orderDate)}</span>
                {order.estimatedDelivery && (
                  <span className="order-delivery">
                    <FaTruck /> {order.estimatedDelivery}
                  </span>
                )}
                {order.promoCode && (
                  <span className="order-promo">Code {order.promoCode}</span>
                )}
              </div>

              {order.itemsOrdered && (
                <p className="order-items-summary">{order.itemsOrdered}</p>
              )}

              <div className="order-card-bottom">
                <span className="order-count">
                  {order.items.length} ligne(s)
                </span>
                <strong className="order-total">
                  {order.totalAmount || `$${order.totalPrice.toFixed(2)}`}
                </strong>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
