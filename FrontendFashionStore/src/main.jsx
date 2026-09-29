import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import React from "react";

const mount = () => {
  createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <Provider store={store}>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </Provider>
    </BrowserRouter>,
  );
};

const HERO_TIMEOUT = 1000;

const mountAfterPaint = () => {
  requestAnimationFrame(() => requestAnimationFrame(mount));
};

const hero = document.querySelector("img.background-image");

const heroReady =
  hero && typeof hero.decode === "function"
    ? Promise.race([
        hero.decode().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, HERO_TIMEOUT)),
      ])
    : Promise.resolve();

heroReady.then(mountAfterPaint);
