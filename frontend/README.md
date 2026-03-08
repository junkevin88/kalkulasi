# Analisis Ordal — React Frontend

Vite + React + TypeScript frontend for the ownership app. Backend (Hono API) is unchanged.

## Setup

```bash
npm install
```

## Develop

1. Start the API server (from repo root): `deno task web`
2. Start the dev server: `npm run dev`
3. Open **http://localhost:5173/** (Vite proxies `/api` to port 3000)

## Build & serve

From repo root:

```bash
deno task fe:build   # builds to frontend/dist
deno task web        # serves API + React app at /
```

Then open **http://localhost:3000/**.

## Stack

- React 19, TypeScript, Vite 7
- Tailwind CSS 4
- React Router (HashRouter), D3.js for the ownership graph
