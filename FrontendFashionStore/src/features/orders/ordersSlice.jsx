import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadApi } from "../../Api/lazy";
import { normalizeOrder, toArray } from "../../utils/normalize";
import {
  buildOrderPayload,
  buildPaymentPayload,
  buildOrderReviewPayload,
} from "../../utils/checkoutMapper";
import { rememberOrderId, getOrderIds, readJSON, writeJSON } from "../../utils/storage";
import { STORAGE_KEYS } from "../../config/env";

const isStripeCheckoutUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
};

export const placeOrder = createAsyncThunk(
  "orders/placeOrder",
  async (checkout, { getState, rejectWithValue }) => {
    const {
      cart = [],
      shippingInfo = {},
      shippingMethod = "standard",
      paymentMethod = "card",
      total = 0,
      promoCode = null,
      isGift = false,
    } = checkout ?? {};

    const { ordersApi, paymentsApi, orderReviewsApi } = await loadApi();

    const state = getState();
    const catalogue = state.products?.items ?? [];
    const warnings = [];

    let order;
    try {
      order = await ordersApi.createOrder(
        buildOrderPayload({
          cart,
          catalogue,
          shippingMethod,
          promoCode,
        }),
      );
    } catch (error) {
      return rejectWithValue(error.message);
    }

    if (!order?._id) {
      return rejectWithValue(
        order?.message || "La commande n'a pas pu être enregistrée.",
      );
    }

    rememberOrderId(order._id);

    const serverTotal = Number(order.totalPrice);
    if (Number.isFinite(serverTotal) && Math.abs(serverTotal - Number(total)) > 0.01) {
      warnings.push(
        `Le total a été recalculé par le serveur : $${serverTotal.toFixed(2)}.`,
      );
    }

    let payment = null;
    try {
      payment = await paymentsApi.createPayment(
        buildPaymentPayload({
          orderId: order._id,
          shippingInfo,
          shippingMethod,
          paymentMethod,
          isGift,
        }),
      );
    } catch (error) {
      warnings.push(`Paiement non enregistré : ${error.message}`);
    }

    let orderReview = null;
    try {
      orderReview = await orderReviewsApi.createOrderReview(
        buildOrderReviewPayload({
          orderId: order._id,
          paymentId: payment?._id,
          shippingInfo,
          shippingMethod,
          paymentMethod,
          isGift,
        }),
      );
    } catch (error) {
      warnings.push(`Récapitulatif non enregistré : ${error.message}`);
    }

    let checkoutUrl = null;
    if (payment?._id && paymentMethod !== "cash") {
      try {
        const session = await paymentsApi.createCheckoutSession(payment._id);
        checkoutUrl = isStripeCheckoutUrl(session?.url) ? session.url : null;
        if (!checkoutUrl) warnings.push("Lien de paiement Stripe invalide.");
      } catch (error) {
        warnings.push(`Paiement en ligne indisponible : ${error.message}`);
      }
    }

    return {
      order: normalizeOrder(order),
      paymentId: payment?._id ?? null,
      orderReviewId: orderReview?._id ?? null,
      checkoutUrl,
      warnings,
    };
  },
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    const { ordersApi, orderReviewsApi } = await loadApi();
    const byId = new Map();

    try {
      const payload = await orderReviewsApi.getMyOrderReviews();
      toArray(payload).forEach((review) => {
        const order = review?.order;
        if (order?._id) byId.set(String(order._id), normalizeOrder(order));
      });
    } catch (error) {
      if (error.status === 401) return rejectWithValue(error.message);
    }

    const missing = getOrderIds().filter((id) => !byId.has(String(id)));
    const fetched = await Promise.all(
      missing.map((id) => ordersApi.getOrderById(id).catch(() => null)),
    );
    fetched.forEach((order) => {
      if (order?._id) byId.set(String(order._id), normalizeOrder(order));
    });

    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.orderDate) - new Date(a.orderDate),
    );
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (id, { rejectWithValue }) => {
    try {
      const { ordersApi } = await loadApi();
      return normalizeOrder(await ordersApi.getOrderById(id));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const cacheOrder = (order) => {
  const cached = readJSON(STORAGE_KEYS.orders, []);
  const list = Array.isArray(cached) ? cached : [];
  writeJSON(
    STORAGE_KEYS.orders,
    [order, ...list.filter((o) => o?.orderNumber !== order?.orderNumber)].slice(0, 50),
  );
};

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    items: [],
    lastOrder: null,
    status: "idle",
    placingStatus: "idle",
    error: null,
    warnings: [],
  },
  reducers: {
    clearLastOrder: (state) => {
      state.lastOrder = null;
      state.placingStatus = "idle";
      state.warnings = [];
    },
    resetOrdersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.placingStatus = "loading";
        state.error = null;
        state.warnings = [];
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placingStatus = "succeeded";
        state.lastOrder = action.payload.order;
        state.warnings = action.payload.warnings;
        state.items = [
          action.payload.order,
          ...state.items.filter((o) => o.id !== action.payload.order.id),
        ];
        cacheOrder(action.payload.order);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placingStatus = "failed";
        state.error = action.payload || "Commande refusée par le serveur";
      })

      .addCase(fetchMyOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Historique indisponible";
      })

      .addCase(fetchOrderById.fulfilled, (state, action) => {
        if (!action.payload) return;
        state.items = [
          action.payload,
          ...state.items.filter((o) => o.id !== action.payload.id),
        ];
      });
  },
});

export const { clearLastOrder, resetOrdersError } = ordersSlice.actions;

export const selectOrders = (state) => state.orders.items;
export const selectLastOrder = (state) => state.orders.lastOrder;
export const selectIsPlacingOrder = (state) =>
  state.orders.placingStatus === "loading";

export default ordersSlice.reducer;
