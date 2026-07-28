# Topinz API — Internal Contract (Frontend ⇄ Backend)

Single source of truth for API shapes, routes, and conventions. Both `frontend/` and `backend/` must follow this exactly.

## Conventions

- Backend base URL: `http://localhost:4000` (env `NEXT_PUBLIC_API_URL` on frontend).
- **Platform API envelope** (everything except `/api/v1/*`):
  - Success: `{ "success": true, "message"?: string, "data": <payload> }`
  - Error: `{ "success": false, "message": string, "errors"?: { field: string, message: string }[] }`
- **Public keyed API envelope** (`/api/v1/*`): `{ "success": boolean, "creator": "Topinz API", "result": <payload> }` or `{ "success": false, "creator": "Topinz API", "message": string }`
- Auth: `Authorization: Bearer <jwt>`. Frontend stores JWT in cookie `topinz_token` (7d) + role in cookie `topinz_role` (UX guard only; server always re-checks).
- Public API key passed as header `apikey` (also accepts `x-api-key` or query `?apikey=`).
- Pagination query: `?page=1&limit=10` → response `data: { items: [...], total, page, limit, totalPages }`.
- Dates: ISO 8601 strings.

## Types (mirror in frontend/lib/types.ts)

```ts
type Role = "free" | "premium" | "admin";

interface WhitelistIP { _id: string; ip: string; label?: string; createdAt: string }

interface User {
  _id: string; role: Role; name: string; username: string; email: string;
  phone: string; apiKey: string; limit: number;            // daily request limit
  premiumExpiresAt: string | null; whitelistIPs: WhitelistIP[];
  createdAt: string; updatedAt: string;
}

interface Category {
  _id: string; name: string; slug: string; description: string;
  active: boolean; sortOrder: number; endpointCount?: number;
  createdAt: string; updatedAt: string;
}

interface EndpointParam { name: string; type: string; required: boolean; description: string; in: "query" | "body" | "path" | "header" }
interface ResponseCode { code: number; description: string }

interface ApiEndpoint {
  _id: string; name: string; slug: string;
  category: Category | string;                              // populated on reads
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;                                             // e.g. "/api/v1/tools/password"
  shortDescription: string; description: string;
  status: "active" | "maintenance" | "deprecated";
  published: boolean; premiumOnly: boolean;
  rateLimit: number;                                        // req/min per user on this endpoint
  requestCost: number; tags: string[];
  params: EndpointParam[];
  exampleRequest: string;                                   // e.g. "/api/v1/tools/password?length=16"
  exampleResponse: string;                                  // JSON string
  responseCodes: ResponseCode[];
  sortOrder: number; createdAt: string; updatedAt: string;
}

interface RequestLog {
  _id: string; user: { _id: string; username: string } | string | null;
  apiKey: string; endpoint: string; method: string; statusCode: number;
  ip: string; responseTimeMs: number; cost: number; createdAt: string;
}

interface PricingPlan { id: "free" | "premium"; name: string; price: number; period: string; description: string; dailyLimit: number; features: string[]; highlighted: boolean }
```

## Routes

### Auth (`/auth`) — rate-limited 20 req/15min
- `POST /auth/register` body `{ email, username, phone, password, confirmPassword, acceptTerms }`
  - Rules: email valid+unique; username `^[a-z0-9_]{3,20}$` unique (lowercased); phone `^\+62\d{8,13}$`; password ≥ 8; confirm equal; acceptTerms === true.
  - Creates: role `free`, limit `30`, apiKey `Tpz-<username>`, name = username.
  - 201 → `data: { user, token }`
- `POST /auth/login` body `{ identifier, password }` (identifier = email OR username) → `data: { user, token }`
- `POST /auth/forgot-password` body `{ email }` → always `{ success: true, message }`; in dev returns `data.resetToken`, logs reset URL to console.
- `POST /auth/reset-password` body `{ token, password, confirmPassword }` → success message.

### User (`/user`, JWT)
- `GET /user/profile` → `data: { user }`
- `PUT /user/profile` body `{ name?, phone? }` → `data: { user }`
- `PUT /user/password` body `{ currentPassword, newPassword, confirmPassword }` → message.

### Dashboard (`/dashboard`, JWT)
- `GET /dashboard` → `data: { role, apiKey, limit, usedToday, remainingToday, premiumExpiresAt, whitelistCount, todayRequest, totalRequest, usage: { date: "YYYY-MM-DD", count: number }[] /* last 14 days */, recentLogs: RequestLog[] /* 5 */ }`

### API Key (`/apikey`, JWT)
- `GET /apikey` → `data: { apiKey }`
- `PUT /apikey/reset` → `data: { apiKey }` (new format `Tpz-<username>-<6 rand>`)

### Whitelist (`/whitelist`, JWT)
- `GET /whitelist` → `data: { items: WhitelistIP[] }`
- `POST /whitelist` body `{ ip, label? }` — rejects `0.0.0.0`, invalid IPv4, duplicates → `data: { items }`
- `PUT /whitelist/:id` body `{ ip, label? }` → `data: { items }`
- `DELETE /whitelist/:id` → `data: { items }`

### Logs (`/logs`, JWT — own logs)
- `GET /logs?page&limit&q&method&status` (`q` matches endpoint path, `status` = exact code or `2xx|4xx|5xx`) → paginated `RequestLog[]`

### Categories (`/categories`)
- `GET /categories` (public → active only, sorted; with `?all=true` + admin JWT → all incl. inactive, each with `endpointCount`)
- `POST /categories` (admin) `{ name, description?, active? }`
- `PUT /categories/:id` (admin) `{ name?, description?, active? }`
- `DELETE /categories/:id` (admin — fails 400 if it has endpoints)
- `PUT /categories/reorder` (admin) `{ ids: string[] }`

### Endpoints (`/endpoint`)
- `GET /endpoint?category=<slug>&q&method&page&limit&all=true` (public → published only; `all=true` + admin → everything, any status)
- `GET /endpoint/:id` (admin) → full doc
- `POST /endpoint` (admin) — full ApiEndpoint fields (server generates slug)
- `PUT /endpoint/:id` (admin)
- `DELETE /endpoint/:id` (admin)
- `PATCH /endpoint/:id/publish` (admin) `{ published: boolean }`

### Docs (public)
- `GET /docs/nav` → `data: { categories: { name, slug, endpoints: { name, slug, method, path, premiumOnly }[] }[] }` (published + active category only)
- `GET /docs/endpoint/:slug` → `data: { endpoint: ApiEndpoint }` (published only)

### Admin (`/admin`, JWT + role admin)
- `GET /admin/stats` → `data: { todayRequest, totalRequest, totalUser, premiumUser, freeUser, totalEndpoint, totalCategory, monthRequest, requestsPerDay: { date, count }[] /* last 30d */, topEndpoints: { endpoint, count }[] /* top 5 */, recentLogs: RequestLog[] }`
- `GET /admin/users?q&role&page&limit` → paginated users (no password)
- `GET /admin/users/:id` → `data: { user, stats: { totalRequest, todayRequest } }`
- `PUT /admin/users/:id` body `{ role?, limit?, premiumExpiresAt?, name? }` → user
- `DELETE /admin/users/:id`
- `GET /admin/logs?q&method&status&user&page&limit` → paginated logs (user populated `{_id, username}`)
- `GET /admin/settings` → `data: { settings }` / `PUT /admin/settings` body `{ siteName?, siteDescription?, maintenanceMode?, allowRegistration? }`
- `GET /admin/audit?page&limit` → paginated audit logs `{ actor: {username}, action, target, ip, createdAt }`

### Pricing & Status (public)
- `GET /pricing` → `data: { plans: PricingPlan[] }` ; `PUT /admin/pricing` body `{ plans }` (admin)
- `GET /status/public` → `data: { operational: boolean, uptimePercent: number, avgResponseMs: number, totalEndpoints: number, services: { name, operational, uptimePercent, days: { date, status: "ok"|"degraded"|"down" }[] /* 90 */ }[], incidents: { date, title, description, resolved }[] }`

### Public keyed API (`/api/v1/*`) — middleware chain: apikey → 0.0.0.0 block → whitelist → premium check → daily limit → per-endpoint rate limit → handler → request log
Real handlers: `GET /api/v1/tools/password?length=`, `GET /api/v1/tools/uuid`, `POST /api/v1/tools/hash {text, algorithm?}`, `GET /api/v1/tools/qrcode?text=`, `GET /api/v1/text/case?text=&mode=upper|lower|title`, `GET /api/v1/text/slug?text=`, `GET /api/v1/text/count?text=`, `GET /api/v1/utility/myip`, `GET /api/v1/anime/quotes`.
All other documented+published endpoints are served by a catch-all that returns the endpoint's `exampleResponse` (mock mode, `"mock": true` added to envelope).
Errors: 401 invalid key, 403 forbidden IP / premium required, 429 daily limit or rate limit exceeded, 404 unknown endpoint, 503 maintenance.

## Seed data (backend `npm run seed`)
- Admin: `admin@topinz.dev` / username `admin` / password `Admin123!` (role admin)
- Demo premium: `dimas@example.com` / `dimasdev` / `Premium123!` (premium, expires +30d)
- Demo free: `sari@example.com` / `saricode` / `Freeuser123!`
- 10 categories: AI, Downloader, Payment, Tools, Utility, Webhook, Anime, Image, Text, Admin
- ~24 endpoints with full docs metadata; ~4000 request logs spread over 30 days.
