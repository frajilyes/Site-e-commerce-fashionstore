import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  authApi,
  clothesApi,
  ordersApi,
  orderReviewsApi,
  paymentsApi,
  reviewsApi,
  usersApi,
  wishlistApi,
} from "./index";
import { API_BASE_URL, IS_STRIPE_ENABLED } from "../config/env";
import { toArray } from "../utils/normalize";
import useApiHealth from "../hooks/useApiHealth";

const PROBES = [
  {
    key: "clothes",
    label: "Catalogue",
    method: "GET /api/clothes",
    access: "public",
    run: () => clothesApi.getClothes(),
  },
  {
    key: "reviews",
    label: "Avis produits",
    method: "GET /api/reviews",
    access: "public",
    run: () => reviewsApi.getReviews(),
  },
  {
    key: "me",
    label: "Session",
    method: "GET /api/auth/me",
    access: "connecte",
    run: () => authApi.me(),
  },
  {
    key: "profile",
    label: "Profil",
    method: "GET /api/users/profile",
    access: "connecte",
    run: () => usersApi.getProfile(),
  },
  {
    key: "orderReviews",
    label: "Mes commandes",
    method: "GET /api/order-reviews",
    access: "connecte",
    run: () => orderReviewsApi.getMyOrderReviews(),
  },
  {
    key: "users",
    label: "Utilisateurs",
    method: "GET /api/users",
    access: "admin",
    run: () => usersApi.getAllUsers(),
  },
  {
    key: "orders",
    label: "Toutes les commandes",
    method: "GET /api/orders",
    access: "admin",
    run: () => ordersApi.getAllOrders(),
  },
  {
    key: "payments",
    label: "Paiements",
    method: "GET /api/payments",
    access: "admin",
    run: () => paymentsApi.getAllPayments(),
  },
  {
    key: "wishlists",
    label: "Wishlists",
    method: "GET /api/wishlists",
    access: "admin",
    run: () => wishlistApi.getAllWishlists(),
  },
];

const describe = (payload) => {
  if (payload === null || payload === undefined) return "vide";
  if (Array.isArray(payload)) return `${payload.length} element(s)`;
  if (Array.isArray(payload?.data)) {
    return `${payload.total ?? payload.data.length} element(s)`;
  }
  if (typeof payload === "object") {
    return `objet (${Object.keys(payload).length} champs)`;
  }
  return String(payload);
};

const STATUS_COLOR = {
  ok: "#00c86f",
  error: "#ff5470",
  pending: "#f5a623",
};

const PENDING_RESULTS = Object.fromEntries(
  PROBES.map((probe) => [probe.key, { state: "pending" }]),
);

const runProbeSuite = async () => {
  const entries = await Promise.all(
    PROBES.map(async (probe) => {
      try {
        const payload = await probe.run();
        return [
          probe.key,
          {
            state: "ok",
            summary: describe(payload),
            sample: toArray(payload).slice(0, 3),
          },
        ];
      } catch (error) {
        return [
          probe.key,
          {
            state: "error",
            summary: `${error.status || "reseau"} - ${error.message}`,
          },
        ];
      }
    }),
  );

  return Object.fromEntries(entries);
};

const Row = ({ label, value, color }) => (
  <>
    <dt style={styles.dt}>{label}</dt>
    <dd style={{ ...styles.dd, color: color ?? "#e7e7ea" }}>{value}</dd>
  </>
);

const Api = () => {
  const {
    status: healthStatus,
    uptime,
    error: healthError,
    check,
  } = useApiHealth();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const catalogueSource = useSelector((state) => state.products.source);

  const [results, setResults] = useState(() => PENDING_RESULTS);
  const [runId, setRunId] = useState(0);
  const isRunning = results === PENDING_RESULTS;

  useEffect(() => {
    let cancelled = false;

    runProbeSuite().then((next) => {
      if (!cancelled) setResults(next);
    });

    return () => {
      cancelled = true;
    };
  }, [runId]);

  const rerun = useCallback(() => {
    setResults(PENDING_RESULTS);
    setRunId((id) => id + 1);
  }, []);

  const serverValue =
    healthStatus === "online"
      ? `en ligne (uptime ${Math.round(uptime ?? 0)} s)`
      : healthStatus === "checking"
        ? "verification en cours..."
        : `hors ligne - ${healthError ?? "injoignable"}`;

  const serverColor =
    healthStatus === "online"
      ? STATUS_COLOR.ok
      : healthStatus === "checking"
        ? STATUS_COLOR.pending
        : STATUS_COLOR.error;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Etat de l&apos;API</h1>
        <p style={styles.subtitle}>
          Verifie la connexion entre ce frontend et BackendFashionStore.
        </p>
      </header>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Configuration</h2>
        <dl style={styles.grid}>
          <Row label="URL de l'API" value={API_BASE_URL} />
          <Row label="Serveur" value={serverValue} color={serverColor} />
          <Row
            label="Catalogue affiche"
            value={
              catalogueSource === "api"
                ? "donnees du backend"
                : "aucune donnee (GET /api/clothes n'a rien renvoye)"
            }
          />
          <Row
            label="Utilisateur"
            value={
              isAuthenticated
                ? `${user?.firstName ?? ""} ${user?.lastName ?? ""} (${user?.role ?? "user"})`
                : "non connecte"
            }
          />
          <Row
            label="Stripe"
            value={
              IS_STRIPE_ENABLED ? "cle publique configuree" : "non configure"
            }
          />
        </dl>

        <div style={styles.actions}>
          <button type="button" style={styles.button} onClick={check}>
            Re-tester le serveur
          </button>
          <button
            type="button"
            style={styles.button}
            onClick={rerun}
            disabled={isRunning}
          >
            {isRunning ? "Test en cours..." : "Relancer les sondes"}
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Ressources</h2>
        <p style={styles.hint}>
          Un 401 ou un 403 sur une ligne « connecte » ou « admin » est le
          comportement attendu quand on n&apos;a pas les droits correspondants.
        </p>

        <div style={styles.table}>
          {PROBES.map((probe) => {
            const result = results[probe.key] ?? { state: "pending" };
            return (
              <div key={probe.key} style={styles.row}>
                <span
                  style={{
                    ...styles.dot,
                    background:
                      STATUS_COLOR[result.state] ?? STATUS_COLOR.pending,
                  }}
                />
                <div style={styles.rowMain}>
                  <strong style={styles.rowLabel}>{probe.label}</strong>
                  <code style={styles.rowMethod}>{probe.method}</code>
                </div>
                <span style={styles.badge}>{probe.access}</span>
                <span style={styles.rowResult}>
                  {result.state === "pending" ? "..." : result.summary}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "6rem 1.5rem 4rem",
    background: "#0d0d12",
    color: "#e7e7ea",
    fontFamily: "system-ui, sans-serif",
  },
  header: { maxWidth: 960, margin: "0 auto 2rem" },
  title: { fontSize: "2rem", fontWeight: 700, margin: 0 },
  subtitle: { color: "#8d8d99", marginTop: ".5rem" },
  card: {
    maxWidth: 960,
    margin: "0 auto 1.5rem",
    padding: "1.5rem",
    borderRadius: 16,
    background: "#15151d",
    border: "1px solid #23232e",
  },
  cardTitle: { fontSize: "1.1rem", margin: "0 0 1rem", fontWeight: 600 },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 200px) 1fr",
    gap: ".6rem 1rem",
    margin: 0,
  },
  dt: { color: "#8d8d99", fontSize: ".9rem" },
  dd: { margin: 0, fontSize: ".9rem", wordBreak: "break-word" },
  actions: {
    display: "flex",
    gap: ".75rem",
    marginTop: "1.5rem",
    flexWrap: "wrap",
  },
  button: {
    padding: ".55rem 1.1rem",
    borderRadius: 999,
    border: "1px solid #33333f",
    background: "#1e1e28",
    color: "#e7e7ea",
    cursor: "pointer",
    fontSize: ".85rem",
  },
  hint: { color: "#8d8d99", fontSize: ".85rem", marginTop: 0 },
  table: { display: "flex", flexDirection: "column", gap: ".5rem" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: ".75rem",
    padding: ".7rem .9rem",
    borderRadius: 10,
    background: "#11111a",
    flexWrap: "wrap",
  },
  dot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  rowMain: { display: "flex", flexDirection: "column", minWidth: 200, flex: 1 },
  rowLabel: { fontSize: ".9rem" },
  rowMethod: { color: "#6f6f7d", fontSize: ".75rem" },
  badge: {
    fontSize: ".7rem",
    padding: ".15rem .5rem",
    borderRadius: 999,
    background: "#23232e",
    color: "#9a9aa8",
  },
  rowResult: { fontSize: ".8rem", color: "#a5a5b4", minWidth: 180 },
};

export default Api;
