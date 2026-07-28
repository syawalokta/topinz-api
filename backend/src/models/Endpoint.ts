import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type EndpointStatus = "active" | "maintenance" | "deprecated";

export interface IEndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  in: "query" | "body" | "path" | "header";
}

export interface IResponseCode {
  code: number;
  description: string;
}

export interface IEndpoint {
  name: string;
  slug: string;
  category: Types.ObjectId;
  method: HttpMethod;
  path: string;
  shortDescription: string;
  description: string;
  status: EndpointStatus;
  published: boolean;
  premiumOnly: boolean;
  rateLimit: number; // req/min per user on this endpoint
  requestCost: number;
  tags: string[];
  params: IEndpointParam[];
  exampleRequest: string;
  exampleResponse: string;
  responseCodes: IResponseCode[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EndpointDocument = HydratedDocument<IEndpoint>;

const paramSchema = new Schema<IEndpointParam>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
    description: { type: String, default: "" },
    in: { type: String, enum: ["query", "body", "path", "header"], default: "query" },
  },
  { _id: false }
);

const responseCodeSchema = new Schema<IResponseCode>(
  {
    code: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const endpointSchema = new Schema<IEndpoint>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], required: true },
    path: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "maintenance", "deprecated"], default: "active" },
    published: { type: Boolean, default: true },
    premiumOnly: { type: Boolean, default: false },
    rateLimit: { type: Number, default: 60 },
    requestCost: { type: Number, default: 1 },
    tags: { type: [String], default: [] },
    params: { type: [paramSchema], default: [] },
    exampleRequest: { type: String, default: "" },
    exampleResponse: { type: String, default: "" },
    responseCodes: { type: [responseCodeSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

endpointSchema.index({ category: 1, published: 1 });

export const Endpoint: Model<IEndpoint> = mongoose.model<IEndpoint>("Endpoint", endpointSchema);
