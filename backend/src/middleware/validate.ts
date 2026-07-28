import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodTypeAny } from "zod";
import { fail, FieldError } from "../utils/apiResponse";

/**
 * Validates req[source] against a zod schema. On failure responds 400 with
 * `errors: [{ field, message }]`; on success replaces the payload with the
 * parsed (typed, defaulted) value.
 */
export function validate(schema: ZodTypeAny, source: "body" | "query" | "params" = "body"): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors: FieldError[] = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));
      fail(res, errors[0]?.message ?? "Validation failed", 400, errors);
      return;
    }
    req[source] = result.data;
    next();
  };
}
