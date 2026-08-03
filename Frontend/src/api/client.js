import { config } from "../config.js";

const TOKEN_KEY = "grassroots_token";
const USER_KEY = "grassroots_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", params, body, isFormData = false, responseType = "json" } = {}) {
  const url = new URL(config.apiBaseUrl + path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    }
  }

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (res.status === 401) {
    clearSession();
    window.dispatchEvent(new Event("grassroots:unauthorized"));
    throw new ApiError("Session expired.", 401);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(message, res.status);
  }

  if (responseType === "blob") return res.blob();
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  getBlob: (path, params) => request(path, { method: "GET", params, responseType: "blob" }),
  post: (path, body) => request(path, { method: "POST", body: body ?? {} }),
  postForm: (path, formData) => request(path, { method: "POST", body: formData, isFormData: true }),
  put: (path, body) => request(path, { method: "PUT", body: body ?? {} }),
  patch: (path, body) => request(path, { method: "PATCH", body: body ?? {} }),
};
