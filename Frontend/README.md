# Grassroots CRM — Frontend

Plain HTML/CSS/JS admin portal. No build step, no bundler, no npm dependencies.

## Setup

1. Copy the environment template and point it at your backend:

   ```
   cp js/env.example.js js/env.js
   ```

   Edit `js/env.js` and set `API_BASE_URL` to wherever the backend API is running, e.g.:

   ```js
   window.__ENV__ = {
     API_BASE_URL: "http://localhost:4000/api",
   };
   ```

2. Start the dev server:

   ```
   npm start
   ```

   Serves the app at http://localhost:5500 by default. Override the port with `PORT=5501 npm start`.

3. Open http://localhost:5500 in a browser. You'll land on the login page if you're not authenticated.

If `js/env.js` is missing or `API_BASE_URL` isn't set, the app shows a red banner on load telling you what to do — every API call will otherwise fail against the wrong URL.

## Notes

- `js/env.js` is gitignored on purpose — it's environment-specific and never committed. `js/env.example.js` is the tracked template.
- This is a static frontend only. It expects a backend implementing the routes it calls — see `js/api.js` for the request helper and the various `js/pages/**` files for the specific endpoints used. The backend is maintained separately.
- Login is an email + OTP flow; the OTP code itself is configured on the backend side.
