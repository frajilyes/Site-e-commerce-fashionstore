
import axios from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../config/env";
import { getToken, clearSession } from "../utils/storage";
import { UNAUTHORIZED_EVENT } from "./events";

export { UNAUTHORIZED_EVENT };

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export class ApiRequestError extends Error {
  constructor(message, { status = 0, data = null, isNetworkError = false } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

const messageFromError = (error) => {
  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (error.code === "ECONNABORTED") {
    return "Le serveur met trop de temps à répondre. Réessayez.";
  }
  if (!error.response) {
    return "Impossible de joindre le serveur. Vérifiez que l'API est démarrée.";
  }
  return error.message || "Une erreur inattendue est survenue.";
};

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;

    if (status === 401) {
      clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      }
    }

    return Promise.reject(
      new ApiRequestError(messageFromError(error), {
        status,
        data: error.response?.data ?? null,
        isNetworkError: !error.response,
      }),
    );
  },
);

export const get = (url, config) =>
  axiosClient.get(url, config).then((r) => r.data);
export const post = (url, body, config) =>
  axiosClient.post(url, body, config).then((r) => r.data);
export const put = (url, body, config) =>
  axiosClient.put(url, body, config).then((r) => r.data);
export const del = (url, config) =>
  axiosClient.delete(url, config).then((r) => r.data);

export default axiosClient;
