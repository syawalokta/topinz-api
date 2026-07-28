import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export type Role = "free" | "premium" | "admin";

export interface IWhitelistIP {
  _id: Types.ObjectId;
  ip: string;
  label?: string;
  createdAt: Date;
}

export interface IUser {
  role: Role;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string; // select: false
  apiKey: string;
  limit: number; // daily request limit
  premiumExpiresAt: Date | null;
  whitelistIPs: Types.DocumentArray<IWhitelistIP>;
  resetTokenHash?: string | null; // select: false
  resetTokenExpiresAt?: Date | null; // select: false
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const whitelistIPSchema = new Schema<IWhitelistIP>(
  {
    ip: { type: String, required: true },
    label: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ["free", "premium", "admin"], default: "free" },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false },
    apiKey: { type: String, required: true, unique: true },
    limit: { type: Number, default: 30 },
    premiumExpiresAt: { type: Date, default: null },
    whitelistIPs: { type: [whitelistIPSchema], default: [] },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpiresAt: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiresAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
