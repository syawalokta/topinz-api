import { Response } from "express";

export interface FieldError {
  field: string;
  message: string;
}

/** Platform envelope: success */
export function ok(res: Response, data: unknown, message?: string, status = 200): Response {
  const body: Record<string, unknown> = { success: true };
  if (message) body.message = message;
  body.data = data;
  return res.status(status).json(body);
}

/** Platform envelope: error */
export function fail(res: Response, message: string, status = 400, errors?: FieldError[]): Response {
  const body: Record<string, unknown> = { success: false, message };
  if (errors && errors.length > 0) body.errors = errors;
  return res.status(status).json(body);
}

const CREATOR = "Topinz API";

/** Public /api/v1 envelope: success */
export function pubOk(res: Response, result: unknown, extra?: Record<string, unknown>): Response {
  return res.status(200).json({ success: true, creator: CREATOR, ...extra, result });
}

/** Public /api/v1 envelope: error */
export function pubFail(res: Response, message: string, status = 400): Response {
  return res.status(status).json({ success: false, creator: CREATOR, message });
}
