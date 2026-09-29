import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { googleLogin } from "../../pages/Auth/authSlice";
import { GOOGLE_CLIENT_ID, IS_GOOGLE_AUTH_ENABLED } from "../../config/env";
import "./GoogleAuthButton.css";

const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiPromise = null;

const loadGsiScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }
  if (gsiPromise) {
    return gsiPromise;
  }

  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    const script = existing ?? document.createElement("script");

    script.addEventListener("load", () => resolve(window.google));
    script.addEventListener("error", () => {
      gsiPromise = null;
      reject(new Error("Google Sign-In script failed to load"));
    });

    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return gsiPromise;
};

const GoogleAuthButton = ({ text = "continue_with", disabled = false }) => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!IS_GOOGLE_AUTH_ENABLED) return undefined;

    let cancelled = false;

    loadGsiScript()
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (cancelled || !response?.credential) return;
            dispatch(googleLogin(response.credential));
          },
        });

        containerRef.current.innerHTML = "";
        google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: text,
          logo_alignment: "left",
          width: 320,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, text]);

  if (!IS_GOOGLE_AUTH_ENABLED) {
    return null;
  }

  return (
    <div className="google-auth">
      <div className="google-auth-divider">
        <span>OR</span>
      </div>

      <div
        className={`google-auth-button ${disabled ? "is-disabled" : ""}`}
        ref={containerRef}
      />

      {loadError && (
        <p className="google-auth-error">
          Google Sign-In is unavailable right now. Please use the form above.
        </p>
      )}
    </div>
  );
};

export default GoogleAuthButton;
