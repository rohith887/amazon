// Copy this file to env.js (gitignored) and adjust per environment.
// index.html loads env.js before config.js, so this is the one place
// that changes between local / staging / production deployments.
window.__ENV__ = {
  API_BASE_URL: "http://localhost:4000/api",
};
