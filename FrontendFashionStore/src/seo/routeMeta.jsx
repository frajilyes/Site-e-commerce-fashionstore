
const BRAND = "FashionStore";

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/$/, "");

export const DEFAULT_META = {
  title: `${BRAND} — Premium Streetwear & Luxury Fashion Online`,
  description:
    "Shop the FashionStore 2026 collection: premium streetwear and luxury pieces for men, women and kids — shirts, t-shirts, pants, shoes, caps and glasses.",
  robots: "index, follow, max-image-preview:large",
};

const collection = (title, description) => ({
  title: `${title} | ${BRAND}`,
  description,
});

const privatePage = (title, description) => ({
  title: `${title} | ${BRAND}`,
  description,
  robots: "noindex, follow",
});

export const ROUTE_META = {
  "/": {
    title: DEFAULT_META.title,
    description:
      "Elevate your wardrobe with our exclusive streetwear and luxury pieces. Discover the FashionStore 2026 collection for men, women and kids.",
  },
  "/shoplanding": collection(
    "Shop All Collections",
    "Browse every FashionStore collection in one place: men, women and kids clothing, shoes, caps and accessories.",
  ),

  "/menclothing": collection(
    "Men's Clothing",
    "Men's premium streetwear and luxury clothing: shirts, t-shirts, pants, shoes and accessories. New 2026 drop available now.",
  ),
  "/womenclothing": collection(
    "Women's Clothing",
    "Women's premium streetwear and luxury clothing: shirts, t-shirts, pants, shoes and accessories. New 2026 drop available now.",
  ),
  "/kidsclothing": collection(
    "Kids' Clothing",
    "Kids' streetwear made to last: shirts, t-shirts, pants, shoes and accessories in comfortable, durable fabrics.",
  ),

  "/menpants": collection(
    "Men's Pants",
    "Men's pants, from tailored chinos to relaxed cargo fits. Premium fabrics, free wishlist and secure checkout.",
  ),
  "/womenpants": collection(
    "Women's Pants",
    "Women's pants in premium fabrics: straight, wide-leg and tailored fits from the FashionStore collection.",
  ),
  "/kidspants": collection(
    "Kids' Pants",
    "Kids' pants built for play: soft, durable fabrics and easy fits in every size.",
  ),

  "/mencroppedpants": collection(
    "Men's Cropped Pants",
    "Men's cropped pants and shorts: relaxed streetwear cuts in premium cotton and technical blends.",
  ),
  "/womencroppedpants": collection(
    "Women's Cropped Pants",
    "Women's cropped pants and shorts: cropped, culotte and tailored cuts for every season.",
  ),
  "/kidscroppedpants": collection(
    "Kids' Cropped Pants",
    "Kids' cropped pants and shorts in breathable, hard-wearing fabrics.",
  ),

  "/menshirts": collection(
    "Men's Shirts",
    "Men's shirts: oxford, linen and overshirts cut for a modern streetwear silhouette.",
  ),
  "/womenshirts": collection(
    "Women's Shirts",
    "Women's shirts and blouses in premium cotton, linen and silk blends.",
  ),
  "/kidsshirts": collection(
    "Kids' Shirts",
    "Kids' shirts for school and weekends: soft cotton, easy care, every size.",
  ),

  "/mentshirts": collection(
    "Men's T-Shirts",
    "Men's t-shirts: heavyweight cotton tees, graphic prints and essential basics.",
  ),
  "/womentshirts": collection(
    "Women's T-Shirts",
    "Women's t-shirts: cropped, oversized and fitted tees in premium cotton.",
  ),
  "/kidstshirts": collection(
    "Kids' T-Shirts",
    "Kids' t-shirts with prints they will actually want to wear, in soft durable cotton.",
  ),

  "/menshoes": collection(
    "Men's Shoes",
    "Men's sneakers, boots and dress shoes. Streetwear icons and everyday essentials.",
  ),
  "/womenshoes": collection(
    "Women's Shoes",
    "Women's sneakers, boots and heels selected for comfort and street style.",
  ),
  "/kidsshoes": collection(
    "Kids' Shoes",
    "Kids' sneakers and boots built for growing feet: supportive, light and durable.",
  ),

  "/menglasses": collection(
    "Men's Glasses & Sunglasses",
    "Men's sunglasses and optical frames with UV protection and premium acetate builds.",
  ),
  "/womenglasses": collection(
    "Women's Glasses & Sunglasses",
    "Women's sunglasses and optical frames: oversized, cat-eye and minimal metal designs.",
  ),
  "/kidsglasses": collection(
    "Kids' Glasses & Sunglasses",
    "Kids' sunglasses with full UV protection and flexible, shatter-resistant frames.",
  ),

  "/capscollection": collection(
    "Caps Collection",
    "Caps, beanies and bucket hats: the full FashionStore headwear collection for men, women and kids.",
  ),

  "/about": collection(
    "About Us",
    "Who we are, how we source our fabrics and why FashionStore builds streetwear meant to outlast the season.",
  ),
  "/contact": collection(
    "Contact Us",
    "Questions about an order, a size or a return? Reach the FashionStore team and get an answer within 24 hours.",
  ),
  "/search": {
    title: `Search | ${BRAND}`,
    description:
      "Search the full FashionStore catalogue by product, category or audience.",
    robots: "noindex, follow",
  },

  "/wishlist": privatePage(
    "My Wishlist",
    "Every piece you saved, ready to move to your cart.",
  ),
  "/cart": privatePage("My Cart", "Review your cart before checkout."),
  "/checkout": privatePage("Checkout", "Complete your FashionStore order."),
  "/login": privatePage("Log In", "Log in to your FashionStore account."),
  "/register": privatePage(
    "Create an Account",
    "Create a FashionStore account to track orders and save your wishlist.",
  ),
  "/verify-email": privatePage(
    "Verify Your Email",
    "Confirm your email address to activate your FashionStore account.",
  ),
  "/orders": privatePage(
    "My Orders",
    "Track your FashionStore orders and review past purchases.",
  ),
  "/api": privatePage(
    "API Status",
    "Backend connectivity diagnostics.",
  ),
};

export const resolveRouteMeta = (pathname) => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";

  if (ROUTE_META[path]) return ROUTE_META[path];
  if (path.startsWith("/orders/")) return ROUTE_META["/orders"];

  return {
    title: `Page Not Found | ${BRAND}`,
    description: "This page does not exist. Browse our collections instead.",
    robots: "noindex, follow",
  };
};
