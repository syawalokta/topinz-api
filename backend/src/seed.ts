import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDB, disconnectDB } from "./config/db";
import { AuditLog } from "./models/AuditLog";
import { Category } from "./models/Category";
import { Endpoint, IEndpoint, IEndpointParam } from "./models/Endpoint";
import { IRequestLog, RequestLog } from "./models/RequestLog";
import { Setting } from "./models/Setting";
import { User } from "./models/User";
import { initialKey } from "./utils/apikey";
import { slugify } from "./utils/slugify";

// ------------------------------------------------------------------ users --

const SEED_USERS = [
  {
    role: "admin" as const,
    name: "Topinz Admin",
    username: "admin",
    email: "admin@topinz.dev",
    phone: "+6281200000001",
    password: "Admin123!",
    limit: 100000,
    premiumExpiresAt: null as Date | null,
  },
  {
    role: "premium" as const,
    name: "Dimas Pratama",
    username: "dimasdev",
    email: "dimas@example.com",
    phone: "+6281298765432",
    password: "Premium123!",
    limit: 5000,
    premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    role: "free" as const,
    name: "Sari Wulandari",
    username: "saricode",
    email: "sari@example.com",
    phone: "+6281355512345",
    password: "Freeuser123!",
    limit: 30,
    premiumExpiresAt: null as Date | null,
  },
];

// ------------------------------------------------------------- categories --

const SEED_CATEGORIES = [
  { name: "AI", description: "Machine-learning powered endpoints: chat, image generation and translation." },
  { name: "Downloader", description: "Fetch media from popular social platforms without watermarks." },
  { name: "Payment", description: "QRIS payment creation and status checking for Indonesian merchants." },
  { name: "Tools", description: "Everyday developer utilities: passwords, UUIDs, hashes, QR codes." },
  { name: "Utility", description: "Network and infrastructure helpers: IP echo, WHOIS, ping." },
  { name: "Webhook", description: "Relay messages to third-party webhook consumers." },
  { name: "Anime", description: "Anime quotes and catalogue search." },
  { name: "Image", description: "Image processing: compression and effects." },
  { name: "Text", description: "Text transformation: casing, slugs and counting." },
  { name: "Admin", description: "Internal administrative endpoints.", active: false },
];

// -------------------------------------------------------------- endpoints --

interface EndpointDef {
  name: string;
  category: string; // category name
  method: IEndpoint["method"];
  path: string;
  shortDescription: string;
  description: string;
  params?: IEndpointParam[];
  exampleRequest: string;
  exampleResponse: Record<string, unknown>;
  tags: string[];
  premiumOnly?: boolean;
  requestCost?: number;
}

const q = (name: string, description: string, required = true, type = "string"): IEndpointParam => ({
  name,
  type,
  required,
  description,
  in: "query",
});
const b = (name: string, description: string, required = true, type = "string"): IEndpointParam => ({
  name,
  type,
  required,
  description,
  in: "body",
});

const RESPONSE_CODES = (premium: boolean) => [
  { code: 200, description: "Success — the result payload is in `result`." },
  { code: 400, description: "Bad request — a parameter is missing or invalid." },
  { code: 401, description: "Unauthorized — API key missing or invalid." },
  {
    code: 403,
    description: premium
      ? "Forbidden — premium plan required, or your IP is not whitelisted."
      : "Forbidden — your IP is not whitelisted for this API key.",
  },
  { code: 429, description: "Too many requests — daily quota or per-minute rate limit exceeded." },
];

const ENDPOINT_DEFS: EndpointDef[] = [
  // ----- Tools (real handlers) -----
  {
    name: "Password Generator",
    category: "Tools",
    method: "GET",
    path: "/api/v1/tools/password",
    shortDescription: "Generate a cryptographically secure random password.",
    description:
      "Generates a random password using Node's CSPRNG. The character set mixes uppercase, lowercase, digits and symbols. Use the length parameter to control output size.",
    params: [q("length", "Password length between 4 and 128. Defaults to 16.", false, "number")],
    exampleRequest: "GET /api/v1/tools/password?length=16",
    exampleResponse: { password: "xK9!mPq2@wLr7#Zn", length: 16 },
    tags: ["security", "random", "generator"],
  },
  {
    name: "UUID Generator",
    category: "Tools",
    method: "GET",
    path: "/api/v1/tools/uuid",
    shortDescription: "Generate an RFC 4122 version 4 UUID.",
    description:
      "Returns a single random UUID v4 generated with crypto.randomUUID. Handy for correlation IDs, database keys and idempotency tokens.",
    exampleRequest: "GET /api/v1/tools/uuid",
    exampleResponse: { uuid: "3f6c1c9e-5a1d-4c0f-9b2e-8f1a2d3c4b5a" },
    tags: ["uuid", "random", "generator"],
  },
  {
    name: "Hash Text",
    category: "Tools",
    method: "POST",
    path: "/api/v1/tools/hash",
    shortDescription: "Hash a string with md5, sha1, sha256 or sha512.",
    description:
      "Computes a hex digest of the supplied text using the selected algorithm. Defaults to sha256. Intended for checksums and fingerprinting, not for password storage.",
    params: [b("text", "The text to hash."), b("algorithm", "One of md5, sha1, sha256, sha512. Defaults to sha256.", false)],
    exampleRequest: 'POST /api/v1/tools/hash\n{ "text": "hello", "algorithm": "sha256" }',
    exampleResponse: {
      text: "hello",
      algorithm: "sha256",
      hash: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    },
    tags: ["hash", "crypto", "checksum"],
  },
  {
    name: "QR Code Generator",
    category: "Tools",
    method: "GET",
    path: "/api/v1/tools/qrcode",
    shortDescription: "Render any text or URL as a QR code PNG (data URL).",
    description:
      "Encodes the given text into a 512px QR code and returns it as a base64 PNG data URL, ready to drop into an <img> tag. Maximum input length is 1000 characters.",
    params: [q("text", "Text or URL to encode (max 1000 chars).")],
    exampleRequest: "GET /api/v1/tools/qrcode?text=https%3A%2F%2Ftopinz.dev",
    exampleResponse: { text: "https://topinz.dev", image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." },
    tags: ["qrcode", "image", "generator"],
  },
  {
    name: "Website Screenshot",
    category: "Tools",
    method: "GET",
    path: "/api/v1/tools/screenshot",
    shortDescription: "Capture a full-page screenshot of any public website.",
    description:
      "Renders the target URL in a headless browser and returns a hosted PNG capture. Premium only — rendering is resource intensive, so each call costs 2 requests.",
    params: [
      q("url", "Fully qualified URL to capture, e.g. https://example.com."),
      q("fullPage", "Set to true to capture the entire scroll height. Defaults to false.", false, "boolean"),
    ],
    exampleRequest: "GET /api/v1/tools/screenshot?url=https%3A%2F%2Fexample.com",
    exampleResponse: {
      url: "https://example.com",
      image: "https://cdn.topinz.dev/screenshots/a1b2c3d4.png",
      width: 1280,
      height: 720,
      capturedAt: "2026-07-14T08:30:12.000Z",
    },
    tags: ["screenshot", "browser", "premium"],
    premiumOnly: true,
    requestCost: 2,
  },

  // ----- Text (real handlers) -----
  {
    name: "Text Case Converter",
    category: "Text",
    method: "GET",
    path: "/api/v1/text/case",
    shortDescription: "Convert text to UPPER, lower or Title Case.",
    description:
      "Transforms the casing of the supplied text. Supports upper, lower and title modes; defaults to upper when no mode is given.",
    params: [q("text", "Text to convert."), q("mode", "upper | lower | title. Defaults to upper.", false)],
    exampleRequest: "GET /api/v1/text/case?text=hello%20world&mode=title",
    exampleResponse: { mode: "title", original: "hello world", result: "Hello World" },
    tags: ["text", "case", "format"],
  },
  {
    name: "Slug Generator",
    category: "Text",
    method: "GET",
    path: "/api/v1/text/slug",
    shortDescription: "Turn any phrase into a URL-friendly slug.",
    description:
      "Lowercases the input, strips accents and punctuation, and joins words with dashes — perfect for SEO-friendly URLs and file names.",
    params: [q("text", "Text to slugify.")],
    exampleRequest: "GET /api/v1/text/slug?text=Hello%20World!%20Topinz%20API",
    exampleResponse: { original: "Hello World! Topinz API", slug: "hello-world-topinz-api" },
    tags: ["text", "slug", "url"],
  },
  {
    name: "Word Counter",
    category: "Text",
    method: "GET",
    path: "/api/v1/text/count",
    shortDescription: "Count characters, words and lines in a text.",
    description:
      "Returns simple statistics about the supplied text: total characters (including spaces), whitespace-separated words, and lines.",
    params: [q("text", "Text to analyse.")],
    exampleRequest: "GET /api/v1/text/count?text=The%20quick%20brown%20fox",
    exampleResponse: { characters: 19, words: 4, lines: 1 },
    tags: ["text", "count", "statistics"],
  },

  // ----- Utility -----
  {
    name: "My IP",
    category: "Utility",
    method: "GET",
    path: "/api/v1/utility/myip",
    shortDescription: "Echo your public IP address and user agent.",
    description:
      "Returns the caller's IP address as seen by the API together with the User-Agent header. Useful for debugging proxies and whitelist setups.",
    exampleRequest: "GET /api/v1/utility/myip",
    exampleResponse: { ip: "103.147.8.24", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    tags: ["ip", "network", "debug"],
  },
  {
    name: "WHOIS Lookup",
    category: "Utility",
    method: "GET",
    path: "/api/v1/utility/whois",
    shortDescription: "Fetch WHOIS registration data for a domain.",
    description:
      "Looks up registrar, important dates and name servers for the given domain. Results are cached for 24 hours upstream.",
    params: [q("domain", "Domain to query, e.g. topinz.dev.")],
    exampleRequest: "GET /api/v1/utility/whois?domain=topinz.dev",
    exampleResponse: {
      domain: "topinz.dev",
      registrar: "Namecheap, Inc.",
      createdDate: "2021-03-14T09:21:00.000Z",
      expiryDate: "2027-03-14T09:21:00.000Z",
      nameservers: ["ns1.vercel-dns.com", "ns2.vercel-dns.com"],
      status: "clientTransferProhibited",
    },
    tags: ["whois", "domain", "network"],
  },
  {
    name: "Ping Host",
    category: "Utility",
    method: "GET",
    path: "/api/v1/utility/ping",
    shortDescription: "ICMP-style reachability check for a host.",
    description:
      "Sends four probes to the target host and reports reachability, average round-trip time and packet loss percentage.",
    params: [q("host", "Hostname or IP address to ping.")],
    exampleRequest: "GET /api/v1/utility/ping?host=google.com",
    exampleResponse: { host: "google.com", alive: true, avgMs: 23.4, packetLoss: 0 },
    tags: ["ping", "network", "monitoring"],
  },

  // ----- Anime -----
  {
    name: "Anime Quotes",
    category: "Anime",
    method: "GET",
    path: "/api/v1/anime/quotes",
    shortDescription: "Get a random quote from a popular anime.",
    description:
      "Returns one random quote with its character and source series from a curated collection of iconic anime lines.",
    exampleRequest: "GET /api/v1/anime/quotes",
    exampleResponse: {
      quote: "I'm going to be King of the Pirates!",
      character: "Monkey D. Luffy",
      anime: "One Piece",
    },
    tags: ["anime", "quotes", "fun"],
  },
  {
    name: "Anime Search",
    category: "Anime",
    method: "GET",
    path: "/api/v1/anime/search",
    shortDescription: "Search the anime catalogue by title.",
    description:
      "Full-text search across anime titles. Returns basic metadata including type, episode count, score and a short synopsis for each match.",
    params: [q("q", "Search keywords, e.g. one piece.")],
    exampleRequest: "GET /api/v1/anime/search?q=one%20piece",
    exampleResponse: {
      query: "one piece",
      results: [
        {
          title: "One Piece",
          type: "TV",
          episodes: 1100,
          score: 8.7,
          year: 1999,
          synopsis: "Monkey D. Luffy sets off to find the legendary One Piece and become King of the Pirates.",
        },
      ],
    },
    tags: ["anime", "search", "catalogue"],
  },

  // ----- Downloader -----
  {
    name: "TikTok Downloader",
    category: "Downloader",
    method: "GET",
    path: "/api/v1/downloader/tiktok",
    shortDescription: "Download TikTok videos without watermark.",
    description:
      "Resolves a TikTok video URL into direct download links, both with and without watermark, plus the audio track and engagement stats.",
    params: [q("url", "Full TikTok video URL.")],
    exampleRequest: "GET /api/v1/downloader/tiktok?url=https%3A%2F%2Fwww.tiktok.com%2F%40user%2Fvideo%2F72934",
    exampleResponse: {
      title: "Sunset timelapse over Jakarta",
      author: "@dimasfilms",
      duration: 21,
      video: {
        nowm: "https://cdn.topinz.dev/tiktok/72934-nowm.mp4",
        wm: "https://cdn.topinz.dev/tiktok/72934-wm.mp4",
      },
      music: "https://cdn.topinz.dev/tiktok/72934-audio.mp3",
      stats: { plays: 1250000, likes: 98000, comments: 2100, shares: 5400 },
    },
    tags: ["tiktok", "video", "downloader"],
  },
  {
    name: "Instagram Downloader",
    category: "Downloader",
    method: "GET",
    path: "/api/v1/downloader/instagram",
    shortDescription: "Download Instagram posts, reels and stories.",
    description:
      "Extracts direct media URLs from public Instagram posts and reels. Carousel posts return every slide in order.",
    params: [q("url", "Public Instagram post or reel URL.")],
    exampleRequest: "GET /api/v1/downloader/instagram?url=https%3A%2F%2Fwww.instagram.com%2Freel%2FCx1AbCd",
    exampleResponse: {
      type: "reel",
      author: "@saricode",
      caption: "Weekend coding setup",
      media: [{ type: "video", url: "https://cdn.topinz.dev/ig/Cx1AbCd.mp4", thumbnail: "https://cdn.topinz.dev/ig/Cx1AbCd.jpg" }],
    },
    tags: ["instagram", "reel", "downloader"],
  },
  {
    name: "YouTube Downloader",
    category: "Downloader",
    method: "GET",
    path: "/api/v1/downloader/youtube",
    shortDescription: "Download YouTube videos as MP4 or MP3.",
    description:
      "Fetches stream URLs for a YouTube video in the requested quality, including an audio-only MP3 variant. Long videos may take a few seconds to resolve.",
    params: [q("url", "YouTube video URL or ID."), q("quality", "360p | 720p | 1080p | mp3. Defaults to 720p.", false)],
    exampleRequest: "GET /api/v1/downloader/youtube?url=https%3A%2F%2Fyoutu.be%2FdQw4w9WgXcQ&quality=720p",
    exampleResponse: {
      title: "Never Gonna Give You Up",
      channel: "Rick Astley",
      duration: 213,
      quality: "720p",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      download: "https://cdn.topinz.dev/yt/dQw4w9WgXcQ-720p.mp4",
    },
    tags: ["youtube", "video", "downloader"],
  },
  {
    name: "Spotify Downloader",
    category: "Downloader",
    method: "GET",
    path: "/api/v1/downloader/spotify",
    shortDescription: "Download Spotify tracks as high-quality MP3.",
    description:
      "Resolves a Spotify track URL to a 320kbps MP3 download with full metadata and cover art. Premium only due to upstream licensing costs.",
    params: [q("url", "Spotify track URL.")],
    exampleRequest: "GET /api/v1/downloader/spotify?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F4uLU6hMCjMI75M1A2tKUQC",
    exampleResponse: {
      title: "Never Gonna Give You Up",
      artist: "Rick Astley",
      album: "Whenever You Need Somebody",
      durationMs: 213573,
      cover: "https://i.scdn.co/image/ab67616d0000b273...",
      download: "https://cdn.topinz.dev/spotify/4uLU6hMC.mp3",
      bitrate: "320kbps",
    },
    tags: ["spotify", "music", "downloader", "premium"],
    premiumOnly: true,
  },

  // ----- AI -----
  {
    name: "AI Chat",
    category: "AI",
    method: "POST",
    path: "/api/v1/ai/chat",
    shortDescription: "Chat with a state-of-the-art large language model.",
    description:
      "Sends your prompt to our hosted LLM and returns the completion. Supports an optional system instruction for steering tone and behaviour. Each call costs 2 requests.",
    params: [b("prompt", "The user message to answer."), b("system", "Optional system instruction.", false)],
    exampleRequest: 'POST /api/v1/ai/chat\n{ "prompt": "Explain REST in one sentence" }',
    exampleResponse: {
      model: "topinz-chat-1",
      prompt: "Explain REST in one sentence",
      reply: "REST is an architectural style where clients manipulate resources on a server through uniform, stateless HTTP requests.",
      tokens: { prompt: 8, completion: 24 },
    },
    tags: ["ai", "chat", "llm", "premium"],
    premiumOnly: true,
    requestCost: 2,
  },
  {
    name: "AI Image Generator",
    category: "AI",
    method: "POST",
    path: "/api/v1/ai/image",
    shortDescription: "Generate images from text prompts.",
    description:
      "Turns a text prompt into a rendered image using our diffusion model. Supports square and widescreen sizes. Heavy operation — each call costs 2 requests.",
    params: [b("prompt", "Description of the image to generate."), b("size", "512x512 | 1024x1024 | 1280x720. Defaults to 1024x1024.", false)],
    exampleRequest: 'POST /api/v1/ai/image\n{ "prompt": "a cyberpunk jakarta skyline at dusk", "size": "1024x1024" }',
    exampleResponse: {
      model: "topinz-diffusion-2",
      prompt: "a cyberpunk jakarta skyline at dusk",
      size: "1024x1024",
      image: "https://cdn.topinz.dev/ai/img_9f3k2a.png",
      seed: 482913,
    },
    tags: ["ai", "image", "generation", "premium"],
    premiumOnly: true,
    requestCost: 2,
  },
  {
    name: "AI Translate",
    category: "AI",
    method: "GET",
    path: "/api/v1/ai/translate",
    shortDescription: "Translate text between 100+ languages.",
    description:
      "Neural machine translation with automatic source-language detection. Pass ISO 639-1 codes for the target (and optionally source) language.",
    params: [
      q("text", "Text to translate."),
      q("to", "Target language code, e.g. id, en, ja."),
      q("from", "Source language code. Defaults to auto-detect.", false),
    ],
    exampleRequest: "GET /api/v1/ai/translate?text=Good%20morning&to=id",
    exampleResponse: { text: "Good morning", from: "en", to: "id", translated: "Selamat pagi" },
    tags: ["ai", "translate", "language"],
  },

  // ----- Payment -----
  {
    name: "QRIS Create",
    category: "Payment",
    method: "POST",
    path: "/api/v1/payment/qris/create",
    shortDescription: "Create a dynamic QRIS payment code.",
    description:
      "Generates a dynamic QRIS payload and QR image for the given amount. The code expires after 30 minutes. Premium only — intended for production merchants.",
    params: [b("amount", "Amount in IDR (min 1000).", true, "number"), b("note", "Optional order note shown to the payer.", false)],
    exampleRequest: 'POST /api/v1/payment/qris/create\n{ "amount": 50000, "note": "Order #1234" }',
    exampleResponse: {
      id: "qris_8f2k1m9x",
      amount: 50000,
      feeAmount: 350,
      qrString: "00020101021226670016COM.TOPINZ.WWW011893600914...",
      qrImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      expiresAt: "2026-07-14T09:00:00.000Z",
    },
    tags: ["payment", "qris", "indonesia", "premium"],
    premiumOnly: true,
  },
  {
    name: "QRIS Status",
    category: "Payment",
    method: "GET",
    path: "/api/v1/payment/qris/status",
    shortDescription: "Check the payment status of a QRIS code.",
    description:
      "Polls the status of a previously created QRIS payment. Possible states are PENDING, PAID and EXPIRED.",
    params: [q("id", "The QRIS payment id returned by /payment/qris/create.")],
    exampleRequest: "GET /api/v1/payment/qris/status?id=qris_8f2k1m9x",
    exampleResponse: { id: "qris_8f2k1m9x", status: "PAID", amount: 50000, paidAt: "2026-07-14T08:42:17.000Z" },
    tags: ["payment", "qris", "status"],
  },

  // ----- Webhook -----
  {
    name: "Discord Webhook Sender",
    category: "Webhook",
    method: "POST",
    path: "/api/v1/webhook/discord",
    shortDescription: "Relay a message to a Discord webhook.",
    description:
      "Posts a message to the given Discord webhook URL on your behalf, with retry and rate-limit handling. Supports plain content and a custom username.",
    params: [
      b("webhookUrl", "Your Discord webhook URL."),
      b("content", "Message content (max 2000 chars)."),
      b("username", "Override the webhook display name.", false),
    ],
    exampleRequest: 'POST /api/v1/webhook/discord\n{ "webhookUrl": "https://discord.com/api/webhooks/...", "content": "Deploy finished" }',
    exampleResponse: { delivered: true, statusCode: 204, attempts: 1 },
    tags: ["webhook", "discord", "notification"],
  },

  // ----- Image -----
  {
    name: "Image Compressor",
    category: "Image",
    method: "POST",
    path: "/api/v1/image/compress",
    shortDescription: "Compress images up to 90% smaller.",
    description:
      "Downloads the image at the given URL, recompresses it with mozjpeg/oxipng, and returns a hosted optimized copy. Premium only.",
    params: [b("imageUrl", "URL of the image to compress."), b("quality", "1-100 output quality. Defaults to 80.", false, "number")],
    exampleRequest: 'POST /api/v1/image/compress\n{ "imageUrl": "https://example.com/photo.jpg", "quality": 80 }',
    exampleResponse: {
      originalSize: 2048576,
      compressedSize: 431104,
      savedPercent: 78.9,
      url: "https://cdn.topinz.dev/compress/photo-opt.jpg",
    },
    tags: ["image", "compression", "optimization", "premium"],
    premiumOnly: true,
  },
  {
    name: "Image Blur",
    category: "Image",
    method: "GET",
    path: "/api/v1/image/blur",
    shortDescription: "Apply a Gaussian blur to any image URL.",
    description:
      "Fetches the source image and applies a Gaussian blur with the given radius, returning a hosted processed copy.",
    params: [q("imageUrl", "URL of the image to blur."), q("radius", "Blur radius in pixels, 1-50. Defaults to 8.", false, "number")],
    exampleRequest: "GET /api/v1/image/blur?imageUrl=https%3A%2F%2Fexample.com%2Fphoto.jpg&radius=8",
    exampleResponse: { url: "https://cdn.topinz.dev/blur/photo-blur8.png", radius: 8 },
    tags: ["image", "blur", "effect"],
  },
];

// ----------------------------------------------------------- request logs --

const LOG_IP_POOL = [
  "103.147.8.24",
  "114.10.44.203",
  "36.68.221.19",
  "182.253.50.98",
  "139.192.12.77",
  "202.80.212.5",
  "125.164.99.140",
  "180.244.132.61",
  "43.218.7.155",
  "104.28.211.90",
  "66.249.66.1",
  "157.55.39.242",
];

/** Weighted picks: popular endpoints appear more often in the fake traffic. */
const TRAFFIC_WEIGHTS: Record<string, number> = {
  "/api/v1/tools/password": 6,
  "/api/v1/tools/uuid": 5,
  "/api/v1/downloader/tiktok": 5,
  "/api/v1/utility/myip": 4,
  "/api/v1/anime/quotes": 4,
  "/api/v1/downloader/youtube": 3,
  "/api/v1/downloader/instagram": 3,
  "/api/v1/tools/qrcode": 3,
  "/api/v1/tools/hash": 3,
  "/api/v1/text/case": 2,
  "/api/v1/ai/translate": 2,
};

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(arr: T[]): T => arr[rand(arr.length)];

function randomStatusCode(): number {
  const r = Math.random();
  if (r < 0.92) return 200;
  if (r < 0.99) return pick([400, 400, 401, 403, 404, 429]);
  return pick([500, 502]);
}

interface LogUser {
  _id: Types.ObjectId;
  apiKey: string;
  weight: number;
  /** Max requests generated for *today* — keeps demo users under their daily limit. */
  todayCap?: number;
}

function buildLogs(
  endpoints: { path: string; method: string; requestCost: number }[],
  users: LogUser[],
  totalTarget: number
): IRequestLog[] {
  // Weighted endpoint pool.
  const pool: { path: string; method: string; requestCost: number }[] = [];
  for (const e of endpoints) {
    const weight = TRAFFIC_WEIGHTS[e.path] ?? 1;
    for (let i = 0; i < weight; i++) pool.push(e);
  }
  // Weighted user pool.
  const userPool: LogUser[] = [];
  for (const u of users) {
    for (let i = 0; i < u.weight; i++) userPool.push(u);
  }

  const DAYS = 30;
  // Recent days are busier: weight ramps linearly from 1x (30d ago) to 2x (today).
  const dayWeights = Array.from({ length: DAYS }, (_, i) => 1 + (DAYS - 1 - i) / (DAYS - 1)); // i = days ago
  const weightSum = dayWeights.reduce((a, b) => a + b, 0);
  const now = Date.now();

  const logs: IRequestLog[] = [];
  const todayCounts = new Map<string, number>();
  for (let daysAgo = 0; daysAgo < DAYS; daysAgo++) {
    const jitter = 0.85 + Math.random() * 0.3;
    const count = Math.round((dayWeights[daysAgo] / weightSum) * totalTarget * jitter);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - daysAgo);

    for (let i = 0; i < count; i++) {
      const endpoint = pick(pool);
      let user = pick(userPool);
      // Respect per-user caps for today so the free demo account stays under
      // its daily limit (a fresh dashboard should not open in an over-quota state).
      if (daysAgo === 0 && user.todayCap !== undefined) {
        const used = todayCounts.get(user.apiKey) ?? 0;
        if (used + endpoint.requestCost > user.todayCap) {
          user = users.find((u) => u.todayCap === undefined) ?? user;
        }
      }
      if (daysAgo === 0) {
        todayCounts.set(
          user.apiKey,
          (todayCounts.get(user.apiKey) ?? 0) + endpoint.requestCost
        );
      }
      const createdAt = new Date(Math.min(now, dayStart.getTime() + rand(24 * 60 * 60 * 1000)));
      logs.push({
        user: user._id,
        apiKey: user.apiKey,
        endpoint: endpoint.path,
        method: endpoint.method,
        statusCode: randomStatusCode(),
        ip: pick(LOG_IP_POOL),
        // Skewed towards fast responses within the 20-900ms band.
        responseTimeMs: 20 + Math.floor(Math.random() * Math.random() * 880),
        cost: endpoint.requestCost,
        createdAt,
      });
    }
  }
  return logs;
}

// ------------------------------------------------------------------- seed --

export interface SeedSummary {
  users: { role: string; email: string; username: string; password: string; apiKey: string }[];
  categories: number;
  endpoints: number;
  requestLogs: number;
}

export async function runSeed(options: { quiet?: boolean } = {}): Promise<SeedSummary> {
  const log = (...args: unknown[]) => {
    if (!options.quiet) console.log(...args);
  };

  console.warn("[seed] Wiping Users, Categories, Endpoints, RequestLogs, AuditLogs and Settings...");
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Endpoint.deleteMany({}),
    RequestLog.deleteMany({}),
    AuditLog.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  // Users.
  const users = await User.create(
    await Promise.all(
      SEED_USERS.map(async (u) => ({
        role: u.role,
        name: u.name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        password: await bcrypt.hash(u.password, 10),
        apiKey: initialKey(u.username),
        limit: u.limit,
        premiumExpiresAt: u.premiumExpiresAt,
      }))
    )
  );
  log(`[seed] Created ${users.length} users`);

  // Categories (order in SEED_CATEGORIES defines sortOrder).
  const categories = await Category.create(
    SEED_CATEGORIES.map((c, index) => ({
      name: c.name,
      slug: slugify(c.name),
      description: c.description,
      active: c.active ?? true,
      sortOrder: index,
    }))
  );
  const categoryByName = new Map(categories.map((c) => [c.name, c]));
  log(`[seed] Created ${categories.length} categories`);

  // Endpoints (sortOrder increments within each category).
  const perCategoryOrder = new Map<string, number>();
  const endpoints = await Endpoint.create(
    ENDPOINT_DEFS.map((def) => {
      const category = categoryByName.get(def.category);
      if (!category) throw new Error(`[seed] Unknown category "${def.category}" for ${def.name}`);
      const order = perCategoryOrder.get(def.category) ?? 0;
      perCategoryOrder.set(def.category, order + 1);
      return {
        name: def.name,
        slug: slugify(def.name),
        category: category._id,
        method: def.method,
        path: def.path,
        shortDescription: def.shortDescription,
        description: def.description,
        status: "active" as const,
        published: true,
        premiumOnly: def.premiumOnly ?? false,
        rateLimit: 60,
        requestCost: def.requestCost ?? 1,
        tags: def.tags,
        params: def.params ?? [],
        exampleRequest: def.exampleRequest,
        exampleResponse: JSON.stringify(def.exampleResponse, null, 2),
        responseCodes: RESPONSE_CODES(def.premiumOnly ?? false),
        sortOrder: order,
      };
    })
  );
  log(`[seed] Created ${endpoints.length} endpoints`);

  // Request logs: ~4000 spread over the last 30 days, premium user busiest.
  const [admin, dimas, sari] = users;
  const logDocs = buildLogs(
    endpoints.map((e) => ({ path: e.path, method: e.method, requestCost: e.requestCost })),
    [
      { _id: dimas._id, apiKey: dimas.apiKey, weight: 12 }, // ~60%
      { _id: sari._id, apiKey: sari.apiKey, weight: 5, todayCap: 22 }, // ~25%, stays under the 30/day free limit
      { _id: admin._id, apiKey: admin.apiKey, weight: 3 }, // ~15%
    ],
    4000
  );
  for (let i = 0; i < logDocs.length; i += 1000) {
    await RequestLog.insertMany(logDocs.slice(i, i + 1000), { ordered: false });
  }
  log(`[seed] Created ${logDocs.length} request logs`);

  // Settings singleton (defaults include the contract pricing plans).
  await Setting.getMain();
  log("[seed] Created settings (siteName, pricing plans)");

  return {
    users: SEED_USERS.map((u) => ({
      role: u.role,
      email: u.email,
      username: u.username,
      password: u.password,
      apiKey: initialKey(u.username),
    })),
    categories: categories.length,
    endpoints: endpoints.length,
    requestLogs: logDocs.length,
  };
}

async function main(): Promise<void> {
  await connectDB();
  const summary = await runSeed();

  console.log("\nSeeded credentials:");
  console.table(summary.users);
  console.log(
    `Totals: ${summary.categories} categories, ${summary.endpoints} endpoints, ${summary.requestLogs} request logs\n`
  );

  await disconnectDB();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] Failed:", err);
      process.exit(1);
    });
}
