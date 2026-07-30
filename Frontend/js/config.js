const env = window.__ENV__ ?? {};

if (!env.API_BASE_URL) {
  console.warn("window.__ENV__.API_BASE_URL is not set — copy js/env.example.js to js/env.js and adjust it.");
}

export const config = {
  apiBaseUrl: env.API_BASE_URL ?? "/api",
  appName: "Grassroots CRM",
};
