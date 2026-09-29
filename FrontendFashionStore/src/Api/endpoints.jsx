
export const ENDPOINTS = {
  health: "/health",

  auth: {
    register: "/auth/register",
    login: "/auth/login",
    google: "/auth/google",
    verifyEmail: "/auth/verify-email",
    resendVerification: "/auth/resend-verification",
    me: "/auth/me",
  },

  users: {
    profile: "/users/profile",
    password: "/users/password",
    root: "/users",
    byId: (id) => `/users/${id}`,
    role: (id) => `/users/${id}/role`,
  },

  clothes: {
    root: "/clothes",
    byId: (id) => `/clothes/${id}`,
    reviews: (clothesId) => `/clothes/${clothesId}/reviews`,
  },

  reviews: {
    root: "/reviews",
    byId: (id) => `/reviews/${id}`,
  },

  orders: {
    root: "/orders",
    byId: (id) => `/orders/${id}`,
  },

  orderReviews: {
    root: "/order-reviews",
    byId: (id) => `/order-reviews/${id}`,
  },

  carts: {
    root: "/carts",
    byId: (id) => `/carts/${id}`,
  },

  payments: {
    root: "/payments",
    byId: (id) => `/payments/${id}`,
    checkoutSession: (id) => `/payments/${id}/checkout-session`,
  },

  wishlists: {
    root: "/wishlists",
    byId: (id) => `/wishlists/${id}`,
  },

  webhooks: {
    root: "/webhook",
    byId: (id) => `/webhook/${id}`,
  },

  upload: {
    single: "/upload",
    multiple: "/upload/multiple",
  },
};

export default ENDPOINTS;
