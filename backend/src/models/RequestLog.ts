import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IRequestLog {
  user: Types.ObjectId | null;
  apiKey: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip: string;
  responseTimeMs: number;
  cost: number;
  createdAt: Date;
}

export type RequestLogDocument = HydratedDocument<IRequestLog>;

const requestLogSchema = new Schema<IRequestLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    apiKey: { type: String, default: "" },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    ip: { type: String, default: "" },
    responseTimeMs: { type: Number, default: 0 },
    cost: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    // We manage createdAt manually so the seeder can back-date logs.
    timestamps: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

requestLogSchema.index({ user: 1, createdAt: -1 });
requestLogSchema.index({ createdAt: -1 });

export const RequestLog: Model<IRequestLog> = mongoose.model<IRequestLog>("RequestLog", requestLogSchema);
