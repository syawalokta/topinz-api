import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IAuditLog {
  actor: Types.ObjectId | null;
  action: string; // e.g. "user.register", "endpoint.create"
  target: string; // human-readable target, e.g. "user:dimasdev"
  meta: Record<string, unknown>;
  ip: string;
  createdAt: Date;
}

export type AuditLogDocument = HydratedDocument<IAuditLog>;

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    target: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
