import { UserDocument, Role } from "../models/User";
import { EndpointDocument } from "../models/Endpoint";

declare global {
  namespace Express {
    interface Request {
      /** Authenticated platform user (JWT) or public API key owner. */
      user?: UserDocument;
      /** Role after premium-expiry downgrade (never persisted here). */
      effectiveRole?: Role;
      /** Endpoint document matched by the public API middleware, if any. */
      endpointDoc?: EndpointDocument | null;
    }
  }
}

export {};
