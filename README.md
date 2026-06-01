# Lead Routing Demo (Next.js 14)

Technical demo for a lead-routing platform proposal. It implements three required capabilities in a single **Next.js 14 App Router** project:

1. **Multi-tenant middleware** — subdomain from `Host` → mock Redis → request headers → 404 if unknown
2. **PostGIS geofence API** — `GET /api/geofence?lat=&lng=` using Prisma `$queryRaw` + `ST_Contains`
3. **Real-time updates** — Socket.io counter synced across browser tabs in under 500ms

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Multi-tenant testing](#multi-tenant-testing)
- [PostGIS geofence testing](#postgis-geofence-testing)
- [Socket.io real-time testing](#socketio-real-time-testing)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Production build](#production-build)
- [GitHub submission](#github-submission)

---

## Tech stack

| Layer        | Choice                                         |
| ------------ | ---------------------------------------------- |
| Framework    | Next.js 14.2 (App Router)                      |
| Language     | TypeScript                                     |
| Database     | PostgreSQL 16 + PostGIS (Docker)               |
| ORM          | Prisma 5 (`$queryRaw` tagged templates)        |
| Real-time    | Socket.io 4 (custom `server.ts`)               |
| Tenant store | In-memory mock Redis (`src/lib/redis-mock.ts`) |

---

## Prerequisites

Install before you begin:

| Tool        | Version      | Notes                              |
| ----------- | ------------ | ---------------------------------- |
| **Node.js** | 18.x or 20.x | `node -v`                          |
| **npm**     | 9+           | ships with Node                    |
| **Docker**  | 20+          | Docker Desktop or Engine + Compose |
| **Git**     | any          | for pushing a public repo          |

Optional: `curl` for API checks from the terminal.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/devgurru/tenant-geospatial-realtime-platform.git
cd tenant-geospatial-realtime-platform
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Default `DATABASE_URL` points at the Docker PostGIS container:

```env
DATABASE_URL="postgresql://demo:demo@localhost:5433/demo?schema=public"
PORT=3000
```

### 3. Start PostgreSQL + PostGIS

```bash
npm run db:up
```

Wait until the container is healthy (about 10–20 seconds):

```bash
docker compose ps
# STATUS should show "healthy" for db
```

Apply the Prisma schema:

```bash
npm run db:push
```

You should see: `Your database is now in sync with your Prisma schema`.

### 4. Run the application

```bash
npm run dev
```

Expected console output:

```text
> Ready on http://localhost:3000
> Socket.io path: /api/socketio
> Try tenant URL: http://acme.localhost:3000
```

### 5. Open a valid tenant URL

Use a **subdomain** host (bare `http://localhost:3000` returns 404 by design):

| Tenant     | URL                           |
| ---------- | ----------------------------- |
| Acme Corp  | http://acme.localhost:3000    |
| Globex Inc | http://globex.localhost:3000  |
| Initech    | http://initech.localhost:3000 |

Modern browsers resolve `*.localhost` to `127.0.0.1` — **no `/etc/hosts` edits required** on Chrome, Firefox, or Edge.

---

## Environment variables

| Variable              | Required | Default | Description                                             |
| --------------------- | -------- | ------- | ------------------------------------------------------- |
| `DATABASE_URL`        | Yes      | —       | PostgreSQL connection string for Prisma / PostGIS       |
| `PORT`                | No       | `3000`  | HTTP port for `server.ts`                               |
| `NEXT_PUBLIC_APP_URL` | No       | —       | Optional; used for documentation / future client config |

---

## Multi-tenant testing

### How it works

1. `src/middleware.ts` reads the `Host` header (e.g. `acme.localhost:3000`).
2. Subdomain `acme` is extracted (`src/lib/subdomain.ts`).
3. Mock Redis lookup runs (`src/lib/redis-mock.ts`, key `tenant:acme`).
4. On success, headers are set: `x-tenant-id`, `x-tenant-name`, `x-tenant-subdomain`.
5. On failure → **HTTP 404**.

### Valid tenant URLs

| Subdomain | Company    | URL                           |
| --------- | ---------- | ----------------------------- |
| `acme`    | Acme Corp  | http://acme.localhost:3000    |
| `globex`  | Globex Inc | http://globex.localhost:3000  |
| `initech` | Initech    | http://initech.localhost:3000 |

### URLs that must return 404

| URL                           | Reason                      |
| ----------------------------- | --------------------------- |
| http://unknown.localhost:3000 | Subdomain not in mock Redis |
| http://foo.localhost:3000     | Same                        |
| http://localhost:3000         | No subdomain on host        |

### Verify with curl

```bash
# Valid tenant — HTTP 200
curl -s -o /dev/null -w "%{http_code}\n" http://acme.localhost:3000

# Unknown tenant — HTTP 404
curl -s -o /dev/null -w "%{http_code}\n" http://unknown.localhost:3000

# No subdomain — HTTP 404
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```

The home page also lists all valid and invalid URLs under **Multi-tenant middleware**.

---

## PostGIS geofence testing

### API

```http
GET /api/geofence?lat={latitude}&lng={longitude}
```

Must be called on a **valid tenant host** (middleware applies to API routes too).

### Example requests

```bash
# Inside hardcoded San Francisco polygon
curl "http://acme.localhost:3000/api/geofence?lat=37.7799&lng=-122.4144"

# Outside polygon
curl "http://acme.localhost:3000/api/geofence?lat=37.8049&lng=-122.2711"
```

### Example response

```json
{
  "lat": 37.7799,
  "lng": -122.4144,
  "inside": true,
  "polygon": "POLYGON((-122.4194 37.7749, ...))"
}
```

### Implementation notes

- Polygon WKT is hardcoded in `src/lib/geofence.ts`.
- `src/app/api/geofence/route.ts` runs:

  ```sql
  SELECT ST_Contains(
    ST_GeomFromText($wkt, 4326),
    ST_SetSRID(ST_MakePoint($lng, $lat), 4326)
  ) AS inside
  ```

- Coordinates use **WGS84** (EPSG:4326). `ST_MakePoint` takes **(longitude, latitude)**.

### UI testing

On any valid tenant URL, use the **PostGIS geofence check** card:

- **Sample inside** / **Sample outside** — pre-filled coordinates
- **Check geofence** — calls the API and shows INSIDE / OUTSIDE

---

## Socket.io real-time testing

1. Open http://acme.localhost:3000 (or globex / initech) in **two browser tabs**.
2. Wait for **Connected** under the counter.
3. Click **Increment** in one tab.
4. The other tab’s counter updates immediately (typically &lt;50ms on localhost).
5. **Last round-trip** shows latency for the click that triggered the update.

Socket.io is mounted on the same server as Next.js (`server.ts`), path: `/api/socketio`.

---

## Troubleshooting

### Port 5432 already in use

Local PostgreSQL may conflict with Docker.

```bash
# Check what uses 5432
sudo lsof -i :5432

# Option A: stop local Postgres (Linux)
sudo systemctl stop postgresql

# Option B: change Docker host port in docker-compose.yml to "5433:5432"
# and set DATABASE_URL to localhost:5433
```

### `permission denied` on Docker socket

```bash
sudo usermod -aG docker $USER
# log out and back in, then:
npm run db:up
```

### Geofence returns 503

- Container not running: `docker compose ps`
- Schema not pushed: `npm run db:push`
- Wrong `DATABASE_URL` in `.env`

### `localhost:3000` shows 404

Expected. Use `http://acme.localhost:3000` (or globex / initech).

### Counter does not sync across tabs

- Both tabs must use the **same tenant host** (e.g. both `acme.localhost`).
- Dev server must be started with `npm run dev` (not `next dev` alone — Socket.io lives in `server.ts`).

### TypeScript / Prisma

This project uses **Prisma 5**. Geofence queries use Prisma’s **tagged template** on `$queryRaw` (not `Prisma.sql`). After dependency changes:

```bash
npx prisma generate
```

---

## Project structure

```text
server.ts                      # Next.js + Socket.io HTTP server
src/middleware.ts              # Subdomain → mock Redis → headers / 404
src/app/api/geofence/route.ts  # PostGIS ST_Contains API
src/lib/redis-mock.ts          # Mock Redis tenant store
src/lib/geofence.ts            # Hardcoded WKT polygon + sample points
src/lib/tenant-urls.ts         # Valid / invalid URL helpers for UI
src/components/                # TenantBanner, GeofenceChecker, RealtimeCounter
prisma/schema.prisma           # PostgreSQL datasource
docker-compose.yml             # postgis/postgis:16-3.4
docker/init-postgis.sql        # CREATE EXTENSION postgis
```

---

## Production build

```bash
npm run build
npm run start
```

Visit tenant URLs the same way as in development (subdomain hosts).

---

## GitHub submission

```bash
git add .
git commit -m "Lead routing demo: multi-tenant, PostGIS, Socket.io"
git remote add origin https://github.com/devgurru/tenant-geospatial-realtime-platform.git
git branch -M main
git push -u origin main
```

Include the public repo URL in your proposal.

---

## License

MIT — demonstration purposes only.
