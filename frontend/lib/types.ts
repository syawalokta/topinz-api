/** Shared API types — mirrors backend contract (see /CONTRACT.md). */

export type Role = "free" | "premium" | "admin";

export interface WhitelistIP {
  _id: string;
  ip: string;
  label?: string;
  createdAt: string;
}

export interface User {
  _id: string;
  role: Role;
  name: string;
  username: string;
  email: string;
  phone: string;
  apiKey: string;
  limit: number;
  premiumExpiresAt: string | null;
  premiumExpired?: boolean;
  whitelistIPs: WhitelistIP[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  sortOrder: number;
  endpointCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  in: "query" | "body" | "path" | "header";
}

export interface ResponseCode {
  code: number;
  description: string;
}

export interface ApiEndpoint {
  _id: string;
  name: string;
  slug: string;
  category: Category | string;
  method: HttpMethod;
  path: string;
  shortDescription: string;
  description: string;
  status: "active" | "maintenance" | "deprecated";
  published: boolean;
  premiumOnly: boolean;
  rateLimit: number;
  requestCost: number;
  tags: string[];
  params: EndpointParam[];
  exampleRequest: string;
  exampleResponse: string;
  responseCodes: ResponseCode[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestLog {
  _id: string;
  user: { _id: string; username: string } | string | null;
  apiKey: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip: string;
  responseTimeMs: number;
  cost: number;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PricingPlan {
  id: "free" | "premium";
  name: string;
  price: number;
  period: string;
  description: string;
  dailyLimit: number;
  features: string[];
  highlighted: boolean;
}

export interface UsagePoint {
  date: string;
  count: number;
}

export interface UserDashboard {
  role: Role;
  apiKey: string;
  limit: number;
  usedToday: number;
  remainingToday: number;
  premiumExpiresAt: string | null;
  whitelistCount: number;
  todayRequest: number;
  totalRequest: number;
  usage: UsagePoint[];
  recentLogs: RequestLog[];
}

export interface AdminStats {
  todayRequest: number;
  totalRequest: number;
  totalUser: number;
  premiumUser: number;
  freeUser: number;
  totalEndpoint: number;
  totalCategory: number;
  monthRequest: number;
  requestsPerDay: UsagePoint[];
  topEndpoints: { endpoint: string; count: number }[];
  recentLogs: RequestLog[];
}

export interface DocsNavEndpoint {
  name: string;
  slug: string;
  method: HttpMethod;
  path: string;
  premiumOnly: boolean;
}

export interface DocsNavCategory {
  name: string;
  slug: string;
  endpoints: DocsNavEndpoint[];
}

export interface StatusDay {
  date: string;
  status: "ok" | "degraded" | "down";
}

export interface StatusService {
  name: string;
  operational: boolean;
  uptimePercent: number;
  days: StatusDay[];
}

export interface StatusData {
  operational: boolean;
  uptimePercent: number;
  avgResponseMs: number;
  totalEndpoints: number;
  services: StatusService[];
  incidents: { date: string; title: string; description: string; resolved: boolean }[];
}

export interface Settings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
}

export interface AuditLogItem {
  _id: string;
  actor: { _id: string; username: string } | null;
  action: string;
  target: string;
  ip: string;
  createdAt: string;
}
