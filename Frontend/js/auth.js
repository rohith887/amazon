import { api, storeSession, clearSession, getToken, getStoredUser } from "./api.js";

const PENDING_EMAIL_KEY = "grassroots_pending_email";

export function requestOtp(email) {
  return api.post("/auth/request-otp", { email }).then(() => {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  });
}

export function resendOtp() {
  const email = sessionStorage.getItem(PENDING_EMAIL_KEY);
  if (!email) throw new Error("No pending email to resend to.");
  return requestOtp(email);
}

export function getPendingEmail() {
  return sessionStorage.getItem(PENDING_EMAIL_KEY);
}

export async function verifyOtp(email, otp) {
  const data = await api.post("/auth/verify-otp", { email, otp });
  storeSession(data.token, data.user);
  sessionStorage.removeItem(PENDING_EMAIL_KEY);
  return data.user;
}

export function logout() {
  clearSession();
  window.location.href = "/login.html";
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function currentUser() {
  return getStoredUser();
}

export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "/login.html";
  }
}

export function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = "/index.html";
  }
}
