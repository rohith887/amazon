const env = window.__ENV__ ?? {};

if (!env.API_BASE_URL) {
  console.warn("window.__ENV__.API_BASE_URL is not set — copy js/env.example.js to js/env.js and adjust it.");
  const banner = document.createElement("div");
  banner.textContent = "Setup needed: copy Frontend/js/env.example.js to js/env.js and set API_BASE_URL to your backend's URL, then reload.";
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:9999;background:#dc2626;color:#fff;padding:10px 16px;font:600 13px/1.5 system-ui,-apple-system,sans-serif;text-align:center;";
  document.body.prepend(banner);
}

export const config = {
  apiBaseUrl: env.API_BASE_URL ?? "/api",
  appName: "Grassroots CRM",
};
