import { get, post } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const register = ({ firstName, lastName, email, phone, password }) =>
  post(ENDPOINTS.auth.register, {
    firstName,
    lastName,
    email,
    phone,
    password,
  });

export const login = ({ email, password }) =>
  post(ENDPOINTS.auth.login, { email, password });

export const googleAuth = (credential) =>
  post(ENDPOINTS.auth.google, { credential });

export const verifyEmail = (token) =>
  post(ENDPOINTS.auth.verifyEmail, { token });

export const resendVerification = (email) =>
  post(ENDPOINTS.auth.resendVerification, { email });

export const me = () => get(ENDPOINTS.auth.me);

export default {
  register,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  me,
};
