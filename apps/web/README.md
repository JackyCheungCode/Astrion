# Astrion web UI

This app is a Carbon React application. The login route is rendered at `/login`. The repository-root `wrangler.jsonc` configures Cloudflare Workers static assets to serve `apps/web/dist` and uses single-page-application fallback for client-side routes.

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

Cloudflare Workers Builds uses the root Wrangler configuration to install `apps/web` dependencies, run the Vite production build, and publish `apps/web/dist` as static assets. The `previews` configuration is required by `npx wrangler preview`.

Authentication is intentionally not implemented. The login form and Google, Apple, and Microsoft options display an informational message only. They do not transmit credentials or start OAuth.

## Carbon

Interactive controls use the official `@carbon/react` components and Carbon styles. The cloud/sun mark is an inline SVG to preserve the requested reference artwork.
