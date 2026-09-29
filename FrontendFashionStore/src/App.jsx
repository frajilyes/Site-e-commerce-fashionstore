import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar/Navbar";
import Homepage from "./pages/HomePage/Homepage";
import AppBootstrap from "./components/AppBootstrap/AppBootstrap";
import LoginAlert from "./components/LoginAlert/LoginAlert";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Seo from "./components/Seo/Seo";

const MenClothing = lazy(() => import("./components/MenClothes/MenClothing"));
const WomenClothing = lazy(() => import("./components/WomenClothes/WomenClothing"));
const KidsClothing = lazy(() => import("./components/KidsClothes/KidsClothing"));
const MenPants = lazy(() => import("./components/MenClothes/MenPants"));
const WomenPants = lazy(() => import("./components/WomenClothes/WomenPants"));
const KidsPants = lazy(() => import("./components/KidsClothes/KidsPants"));
const MenShirts = lazy(() => import("./components/MenClothes/MenShirts"));
const WomenShirts = lazy(() => import("./components/WomenClothes/WomenShirts"));
const KidsShirts = lazy(() => import("./components/KidsClothes/KidsShirts"));
const MenShoes = lazy(() => import("./components/MenClothes/MenShoes"));
const WomenShoes = lazy(() => import("./components/WomenClothes/WomenShoes"));
const KidsShoes = lazy(() => import("./components/KidsClothes/KidsShoes"));
const CapsCollection = lazy(() => import("./components/CapsCollection/CapsCollection"));
const MenGlasses = lazy(() => import("./components/MenClothes/MenGlasses"));
const WomenGlasses = lazy(() => import("./components/WomenClothes/WomenGlasses"));
const KidsGlasses = lazy(() => import("./components/KidsClothes/KidsGlasses"));
const MenCroppedPants = lazy(() => import("./components/MenClothes/MenCroppedPants"));
const WomenCroppedPants = lazy(() => import("./components/WomenClothes/WomenCroppedPants"));
const KidsCroppedPants = lazy(() => import("./components/KidsClothes/KidsCroppedPants"));
const MenTShirts = lazy(() => import("./components/MenClothes/MenTShirts"));
const WomenTShirts = lazy(() => import("./components/WomenClothes/WomenTShirts"));
const KidsTShirts = lazy(() => import("./components/KidsClothes/KidsTShirts"));
const About = lazy(() => import("./pages/About/About"));
const Search = lazy(() => import("./pages/Search/Search"));
const Wishlist = lazy(() => import("./components/WishList/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const Register = lazy(() => import("./pages/Auth/Register"));
const Login = lazy(() => import("./pages/Auth/Login"));
const VerifyEmail = lazy(() => import("./pages/Auth/VerifyEmail"));
const ShopLanding = lazy(() => import("./pages/ShopLanding/ShopLanding"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));
const Contact = lazy(() => import("./components/Contact/Contact"));
const Api = lazy(() => import("./Api/Api"));
const Orders = lazy(() => import("./pages/Orders/Orders"));

const RouteFallback = () => (
  <div className="route-fallback" role="status" aria-live="polite">
    <span className="route-fallback-spinner" aria-hidden="true" />
    <span className="sr-only">Loading...</span>
  </div>
);

const App = () => {
  return (
    <div>
      <Seo />
      <AppBootstrap />
      <LoginAlert />
      <Navbar />
      <main>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/menclothing" element={<MenClothing />} />
            <Route path="/womenclothing" element={<WomenClothing />} />
            <Route path="/kidsclothing" element={<KidsClothing />} />
            <Route path="/menpants" element={<MenPants />} />
            <Route path="/womenpants" element={<WomenPants />} />
            <Route path="/kidspants" element={<KidsPants />} />
            <Route path="/menshirts" element={<MenShirts />} />
            <Route path="/womenshirts" element={<WomenShirts />} />
            <Route path="/kidsshirts" element={<KidsShirts />} />
            <Route path="/menshoes" element={<MenShoes />} />
            <Route path="/womenshoes" element={<WomenShoes />} />
            <Route path="/kidsshoes" element={<KidsShoes />} />
            <Route path="/capscollection" element={<CapsCollection />} />
            <Route path="/menglasses" element={<MenGlasses />} />
            <Route path="/womenglasses" element={<WomenGlasses />} />
            <Route path="/kidsglasses" element={<KidsGlasses />} />
            <Route path="/mencroppedpants" element={<MenCroppedPants />} />
            <Route path="/kidscroppedpants" element={<KidsCroppedPants />} />
            <Route path="/mentshirts" element={<MenTShirts />} />
            <Route path="/womentshirts" element={<WomenTShirts />} />
            <Route path="/kidstshirts" element={<KidsTShirts />} />
            <Route path="/about" element={<About />} />
            <Route path="/search" element={<Search />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Checkout />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/shoplanding" element={<ShopLanding />} />
            <Route path="/womencroppedpants" element={<WomenCroppedPants />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route path="/api" element={<Api />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
