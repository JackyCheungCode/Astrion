# Astrion web UI

This app is a Carbon React-based UI prototype. The login route is rendered at `/login`; static hosting should rewrite application routes to `index.html`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Authentication is intentionally not implemented. The login form and Google, Apple, and Microsoft options display an informational message only. They do not transmit credentials or start OAuth.

## Carbon

Interactive controls use the official `@carbon/react` components and Carbon styles. The cloud/sun mark is an inline SVG to preserve the requested reference artwork.
