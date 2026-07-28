/**
 * Standalone smoke test: boots the app on an ephemeral port against the
 * in-memory MongoDB, seeds it, and exercises the API end-to-end with fetch.
 *
 * Run with: npx tsx src/smoke.ts
 */
import { AddressInfo } from "net";
import type { Server } from "http";

// Force the in-memory DB fallback regardless of any local .env,
// BEFORE the config module is loaded (hence the dynamic imports below).
process.env.MONGODB_URI = "";
process.env.NODE_ENV = "development";

let failures = 0;
let passes = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passes += 1;
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

interface CallResult {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

async function main(): Promise<void> {
  const { connectDB, disconnectDB } = await import("./config/db");
  const { runSeed } = await import("./seed");
  const { createApp } = await import("./server");
  const { User } = await import("./models/User");

  await connectDB();
  await runSeed({ quiet: true });

  const app = createApp();
  const server: Server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const base = `http://127.0.0.1:${port}`;
  console.log(`Smoke test target: ${base}\n`);

  const call = async (
    method: string,
    path: string,
    opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}
  ): Promise<CallResult> => {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON response */
    }
    return { status: res.status, body };
  };

  const goodRegistration = {
    email: "smoke@test.dev",
    username: "smoketester",
    phone: "+628123456789",
    password: "Smoketest123!",
    confirmPassword: "Smoketest123!",
    acceptTerms: true,
  };

  try {
    // ---- register validation -------------------------------------------
    let r = await call("POST", "/auth/register", { body: { ...goodRegistration, phone: "08123456789" } });
    check("register rejects bad phone", r.status === 400 && r.body?.success === false, `status ${r.status}`);

    r = await call("POST", "/auth/register", {
      body: { ...goodRegistration, password: "short", confirmPassword: "short" },
    });
    check("register rejects short password", r.status === 400, `status ${r.status}`);

    r = await call("POST", "/auth/register", { body: { ...goodRegistration, confirmPassword: "Different123!" } });
    check("register rejects mismatched confirm", r.status === 400, `status ${r.status}`);

    r = await call("POST", "/auth/register", { body: { ...goodRegistration, acceptTerms: false } });
    check("register rejects acceptTerms=false", r.status === 400, `status ${r.status}`);

    // ---- successful register -------------------------------------------
    r = await call("POST", "/auth/register", { body: goodRegistration });
    const registered = r.body?.data;
    check(
      "register succeeds with Tpz- key and limit 30",
      r.status === 201 &&
        registered?.user?.apiKey === "Tpz-smoketester" &&
        registered?.user?.limit === 30 &&
        typeof registered?.token === "string",
      `status ${r.status}, body ${JSON.stringify(r.body)?.slice(0, 200)}`
    );
    check("register response does not leak password", registered?.user?.password === undefined);

    // ---- duplicates ------------------------------------------------------
    r = await call("POST", "/auth/register", {
      body: { ...goodRegistration, username: "smoketester2", email: "sari@example.com" },
    });
    check("duplicate email rejected", r.status === 400 && /email/i.test(r.body?.message ?? ""), `status ${r.status}`);

    r = await call("POST", "/auth/register", {
      body: { ...goodRegistration, email: "unique@test.dev", username: "saricode" },
    });
    check("duplicate username rejected", r.status === 400 && /username/i.test(r.body?.message ?? ""), `status ${r.status}`);

    // ---- login -----------------------------------------------------------
    r = await call("POST", "/auth/login", { body: { identifier: "smoke@test.dev", password: goodRegistration.password } });
    check("login via email", r.status === 200 && typeof r.body?.data?.token === "string", `status ${r.status}`);

    r = await call("POST", "/auth/login", { body: { identifier: "smoketester", password: goodRegistration.password } });
    const token: string = r.body?.data?.token;
    check("login via username", r.status === 200 && typeof token === "string", `status ${r.status}`);

    r = await call("POST", "/auth/login", { body: { identifier: "smoketester", password: "WrongPass123!" } });
    check("wrong password → 401", r.status === 401, `status ${r.status}`);

    // ---- profile & dashboard ---------------------------------------------
    r = await call("GET", "/user/profile", { token });
    check("GET /user/profile", r.status === 200 && r.body?.data?.user?.username === "smoketester", `status ${r.status}`);

    r = await call("GET", "/dashboard", { token });
    const dash = r.body?.data;
    check(
      "GET /dashboard shape",
      r.status === 200 &&
        dash?.apiKey === "Tpz-smoketester" &&
        dash?.limit === 30 &&
        typeof dash?.usedToday === "number" &&
        typeof dash?.remainingToday === "number" &&
        Array.isArray(dash?.usage) &&
        dash.usage.length === 14 &&
        Array.isArray(dash?.recentLogs),
      `status ${r.status}, usage len ${dash?.usage?.length}`
    );

    // ---- whitelist ---------------------------------------------------------
    r = await call("POST", "/whitelist", { token, body: { ip: "0.0.0.0", label: "nope" } });
    check(
      "whitelist rejects 0.0.0.0",
      r.status === 400 && r.body?.message === "0.0.0.0 is always blocked and cannot be whitelisted",
      `status ${r.status}, message "${r.body?.message}"`
    );

    r = await call("POST", "/whitelist", { token, body: { ip: "999.1.1.1" } });
    check("whitelist rejects invalid IPv4", r.status === 400, `status ${r.status}`);

    r = await call("POST", "/whitelist", { token, body: { ip: "10.0.0.5", label: "office" } });
    const whitelistItems = r.body?.data?.items;
    check(
      "whitelist add returns full items list",
      r.status === 200 && Array.isArray(whitelistItems) && whitelistItems.length === 1 && whitelistItems[0].ip === "10.0.0.5",
      `status ${r.status}`
    );

    // With a whitelist in place, calls from 127.0.0.1 must be blocked.
    r = await call("GET", "/api/v1/tools/password?length=20", { headers: { apikey: "Tpz-smoketester" } });
    check("public API blocks non-whitelisted IP → 403", r.status === 403, `status ${r.status}`);

    r = await call("DELETE", `/whitelist/${whitelistItems?.[0]?._id}`, { token });
    check("whitelist delete returns empty list", r.status === 200 && r.body?.data?.items?.length === 0, `status ${r.status}`);

    // ---- api key reset -----------------------------------------------------
    r = await call("PUT", "/apikey/reset", { token });
    const newKey: string = r.body?.data?.apiKey;
    check(
      "apikey reset changes key",
      r.status === 200 && typeof newKey === "string" && newKey !== "Tpz-smoketester" && newKey.startsWith("Tpz-smoketester-"),
      `status ${r.status}, key ${newKey}`
    );

    // ---- public API --------------------------------------------------------
    r = await call("GET", "/api/v1/tools/password?length=20", { headers: { apikey: newKey } });
    check(
      "public password gen 200 with valid key",
      r.status === 200 &&
        r.body?.success === true &&
        r.body?.creator === "Topinz API" &&
        typeof r.body?.result?.password === "string" &&
        r.body.result.password.length === 20,
      `status ${r.status}`
    );

    r = await call("GET", "/api/v1/tools/uuid", { headers: { apikey: "Tpz-not-a-real-key" } });
    check("public API invalid key → 401", r.status === 401 && r.body?.message === "Invalid API key", `status ${r.status}`);

    r = await call("GET", "/api/v1/tools/screenshot?url=https%3A%2F%2Fexample.com", { headers: { apikey: newKey } });
    check(
      "premium endpoint with free user → 403",
      r.status === 403 && r.body?.message === "Premium plan required",
      `status ${r.status}, message "${r.body?.message}"`
    );

    r = await call("GET", "/api/v1/downloader/tiktok?url=https%3A%2F%2Fwww.tiktok.com%2Fx", { headers: { apikey: newKey } });
    check(
      "mock endpoint returns mock:true",
      r.status === 200 && r.body?.mock === true && r.body?.success === true && r.body?.result !== undefined,
      `status ${r.status}, body ${JSON.stringify(r.body)?.slice(0, 120)}`
    );

    // ---- daily limit -------------------------------------------------------
    // Used so far today: password (1) + tiktok mock (1) = 2. Limit 3 ⇒ one
    // more request fits, then 429s.
    await User.updateOne({ username: "smoketester" }, { limit: 3 });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const hit = await call("GET", "/api/v1/tools/uuid", { headers: { apikey: newKey } });
      statuses.push(hit.status);
    }
    check(
      "daily limit → 429 after quota exhausted",
      statuses.includes(429) && statuses[statuses.length - 1] === 429,
      `statuses ${statuses.join(",")}`
    );
    check("requests within quota still 200", statuses[0] === 200, `statuses ${statuses.join(",")}`);
    await User.updateOne({ username: "smoketester" }, { limit: 30 });

    // ---- docs --------------------------------------------------------------
    r = await call("GET", "/docs/nav");
    const nav = r.body?.data?.categories;
    check(
      "docs nav non-empty",
      r.status === 200 && Array.isArray(nav) && nav.length > 0 && nav[0].endpoints.length > 0,
      `status ${r.status}, categories ${nav?.length}`
    );

    // ---- admin -------------------------------------------------------------
    r = await call("POST", "/auth/login", { body: { identifier: "admin@topinz.dev", password: "Admin123!" } });
    const adminToken: string = r.body?.data?.token;
    check("admin login", r.status === 200 && typeof adminToken === "string", `status ${r.status}`);

    r = await call("GET", "/admin/stats", { token: adminToken });
    const stats = r.body?.data;
    check(
      "admin stats shape",
      r.status === 200 &&
        typeof stats?.todayRequest === "number" &&
        typeof stats?.totalRequest === "number" &&
        stats?.totalUser >= 4 &&
        typeof stats?.monthRequest === "number" &&
        Array.isArray(stats?.requestsPerDay) &&
        stats.requestsPerDay.length === 30 &&
        Array.isArray(stats?.topEndpoints) &&
        stats.topEndpoints.length > 0 &&
        Array.isArray(stats?.recentLogs),
      `status ${r.status}, requestsPerDay len ${stats?.requestsPerDay?.length}`
    );

    // ---- public status & pricing --------------------------------------------
    r = await call("GET", "/status/public");
    const status = r.body?.data;
    check(
      "status public shape",
      r.status === 200 &&
        typeof status?.operational === "boolean" &&
        typeof status?.uptimePercent === "number" &&
        typeof status?.avgResponseMs === "number" &&
        Array.isArray(status?.services) &&
        status.services.length > 0 &&
        status.services[0].days.length === 90 &&
        Array.isArray(status?.incidents),
      `status ${r.status}, services ${status?.services?.length}`
    );

    r = await call("GET", "/pricing");
    check(
      "pricing returns 2 plans",
      r.status === 200 && Array.isArray(r.body?.data?.plans) && r.body.data.plans.length === 2,
      `status ${r.status}, plans ${r.body?.data?.plans?.length}`
    );
  } finally {
    server.close();
    await disconnectDB();
  }

  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
