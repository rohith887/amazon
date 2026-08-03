# Grassroots CRM — Frontend

React + Vite admin portal for Grassroots CRM.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create your environment file from the template:

   ```
   cp .env.example .env
   ```

   Edit `.env` and set `VITE_API_BASE_URL` to wherever the backend API is running, e.g.:

   ```
   VITE_API_BASE_URL=http://localhost:4000/api
   ```

3. Start the dev server:

   ```
   npm run dev
   ```

   Serves the app at http://localhost:5500 by default. Override the port with `npm run dev -- --port 5501`.

4. Open http://localhost:5500 in a browser. You'll land on the login page if you're not authenticated.

## Build

```
npm run build
```

Outputs a production bundle to `dist/`.

## Notes

- `.env` is gitignored on purpose — it's environment-specific and never committed. `.env.example` is the tracked template. Only `VITE_`-prefixed variables are exposed to the client via `import.meta.env` (see `src/config.js`).
- This is a static frontend only. It expects a backend implementing the routes it calls — see `src/api/client.js` for the request helper and the various `src/pages/**` files for the specific endpoints used. The backend is maintained separately.
- Login is an email + OTP flow; the OTP code itself is configured on the backend side.
