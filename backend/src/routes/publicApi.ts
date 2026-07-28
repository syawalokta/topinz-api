import crypto from "crypto";
import { Router } from "express";
import QRCode from "qrcode";
import { fullApiPath } from "../middleware/apiKeyAuth";
import { Endpoint } from "../models/Endpoint";
import { pubFail, pubOk } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getClientIp } from "../utils/ip";
import { slugify } from "../utils/slugify";

export const publicApiRouter = Router();

// ---------------------------------------------------------------- tools ----

publicApiRouter.get("/tools/password", (req, res) => {
  const raw = req.query.length;
  const length = raw === undefined ? 16 : Number(raw);
  if (!Number.isInteger(length) || length < 4 || length > 128) {
    pubFail(res, "length must be an integer between 4 and 128", 400);
    return;
  }

  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "0123456789" + "!@#$%^&*()-_=+[]{}<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[crypto.randomInt(charset.length)];
  }
  pubOk(res, { password, length });
});

publicApiRouter.get("/tools/uuid", (_req, res) => {
  pubOk(res, { uuid: crypto.randomUUID() });
});

const HASH_ALGORITHMS = ["md5", "sha1", "sha256", "sha512"] as const;
type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

publicApiRouter.post("/tools/hash", (req, res) => {
  const body = (req.body ?? {}) as { text?: unknown; algorithm?: unknown };
  if (typeof body.text !== "string" || body.text.length === 0) {
    pubFail(res, "text is required (string, in the JSON body)", 400);
    return;
  }
  const algorithm = (body.algorithm ?? "sha256") as HashAlgorithm;
  if (!HASH_ALGORITHMS.includes(algorithm)) {
    pubFail(res, `algorithm must be one of: ${HASH_ALGORITHMS.join(", ")}`, 400);
    return;
  }

  const hash = crypto.createHash(algorithm).update(body.text).digest("hex");
  pubOk(res, { text: body.text, algorithm, hash });
});

publicApiRouter.get(
  "/tools/qrcode",
  asyncHandler(async (req, res) => {
    const text = req.query.text;
    if (typeof text !== "string" || text.trim().length === 0) {
      pubFail(res, "text query parameter is required", 400);
      return;
    }
    if (text.length > 1000) {
      pubFail(res, "text must be at most 1000 characters", 400);
      return;
    }

    const image = await QRCode.toDataURL(text, { width: 512, margin: 2 });
    pubOk(res, { text, image });
  })
);

// ----------------------------------------------------------------- text ----

const CASE_MODES = ["upper", "lower", "title"] as const;
type CaseMode = (typeof CASE_MODES)[number];

publicApiRouter.get("/text/case", (req, res) => {
  const text = req.query.text;
  if (typeof text !== "string" || text.length === 0) {
    pubFail(res, "text query parameter is required", 400);
    return;
  }
  const mode = (req.query.mode ?? "upper") as CaseMode;
  if (!CASE_MODES.includes(mode)) {
    pubFail(res, `mode must be one of: ${CASE_MODES.join(", ")}`, 400);
    return;
  }

  let result: string;
  if (mode === "upper") result = text.toUpperCase();
  else if (mode === "lower") result = text.toLowerCase();
  else {
    result = text
      .toLowerCase()
      .replace(/(^|\s)(\S)/g, (_m, space: string, ch: string) => space + ch.toUpperCase());
  }
  pubOk(res, { mode, original: text, result });
});

publicApiRouter.get("/text/slug", (req, res) => {
  const text = req.query.text;
  if (typeof text !== "string" || text.length === 0) {
    pubFail(res, "text query parameter is required", 400);
    return;
  }
  pubOk(res, { original: text, slug: slugify(text) });
});

publicApiRouter.get("/text/count", (req, res) => {
  const text = req.query.text;
  if (typeof text !== "string" || text.length === 0) {
    pubFail(res, "text query parameter is required", 400);
    return;
  }

  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  pubOk(res, { characters: text.length, words, lines: text.split(/\r\n|\r|\n/).length });
});

// -------------------------------------------------------------- utility ----

publicApiRouter.get("/utility/myip", (req, res) => {
  pubOk(res, { ip: getClientIp(req), userAgent: req.headers["user-agent"] ?? "" });
});

// ---------------------------------------------------------------- anime ----

const ANIME_QUOTES: { quote: string; character: string; anime: string }[] = [
  { quote: "I'm going to be King of the Pirates!", character: "Monkey D. Luffy", anime: "One Piece" },
  { quote: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" },
  { quote: "A lesson without pain is meaningless.", character: "Edward Elric", anime: "Fullmetal Alchemist: Brotherhood" },
  { quote: "It's not the face that makes someone a monster; it's the choices they make.", character: "Naruto Uzumaki", anime: "Naruto" },
  { quote: "Hard work is worthless for those that don't believe in themselves.", character: "Naruto Uzumaki", anime: "Naruto Shippuden" },
  { quote: "If you win, you live. If you lose, you die. If you don't fight, you can't win!", character: "Eren Yeager", anime: "Attack on Titan" },
  { quote: "The world is not beautiful, therefore it is.", character: "Kino", anime: "Kino's Journey" },
  { quote: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", character: "Himura Kenshin", anime: "Rurouni Kenshin" },
  { quote: "Power comes in response to a need, not a desire.", character: "Son Goku", anime: "Dragon Ball Z" },
  { quote: "Fear is not evil. It tells you what your weakness is.", character: "Gildarts Clive", anime: "Fairy Tail" },
];

publicApiRouter.get("/anime/quotes", (_req, res) => {
  pubOk(res, ANIME_QUOTES[crypto.randomInt(ANIME_QUOTES.length)]);
});

// ------------------------------------------------------------- catch-all ----

/**
 * Everything else: serve documented endpoints in mock mode from their
 * exampleResponse, 405 on method mismatch, 404 when undocumented/unpublished.
 */
publicApiRouter.all(
  "*",
  asyncHandler(async (req, res) => {
    const path = fullApiPath(req);

    // The middleware already matched path+method; reuse it when present.
    const matched = req.endpointDoc ?? (await Endpoint.findOne({ path, method: req.method }));
    if (matched && matched.published) {
      let payload: unknown = matched.exampleResponse;
      try {
        payload = JSON.parse(matched.exampleResponse);
      } catch {
        // Not valid JSON — return the raw string as-is.
      }
      pubOk(res, payload, { mock: true });
      return;
    }

    const siblings = await Endpoint.find({ path, published: true }).select("method");
    if (siblings.length > 0) {
      const allowed = siblings.map((e) => e.method).join(", ");
      pubFail(res, `Method not allowed. Use ${allowed} for this endpoint.`, 405);
      return;
    }

    pubFail(res, "Endpoint not found. See /docs", 404);
  })
);
