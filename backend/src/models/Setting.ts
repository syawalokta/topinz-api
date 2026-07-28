import mongoose, { Schema, HydratedDocument, Model } from "mongoose";

export interface IPricingPlan {
  id: "free" | "premium";
  name: string;
  price: number;
  period: string;
  description: string;
  dailyLimit: number;
  features: string[];
  highlighted: boolean;
}

export interface ISetting {
  key: string; // always "main" (singleton)
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  pricing: IPricingPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export type SettingDocument = HydratedDocument<ISetting>;

interface SettingModel extends Model<ISetting> {
  /** Returns the singleton settings doc, creating it with defaults when missing. */
  getMain(): Promise<SettingDocument>;
}

const pricingPlanSchema = new Schema<IPricingPlan>(
  {
    id: { type: String, enum: ["free", "premium"], required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    period: { type: String, default: "month" },
    description: { type: String, default: "" },
    dailyLimit: { type: Number, required: true },
    features: { type: [String], default: [] },
    highlighted: { type: Boolean, default: false },
  },
  { _id: false }
);

export const DEFAULT_PRICING: IPricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    description: "Untuk mencoba dan project kecil.",
    dailyLimit: 30,
    features: ["30 request per hari", "Akses endpoint dasar", "Dokumentasi lengkap", "Community support"],
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 49000,
    period: "month",
    description: "Untuk developer dan aplikasi production.",
    dailyLimit: 5000,
    features: [
      "5.000 request per hari",
      "Akses semua endpoint premium",
      "Prioritas response",
      "Whitelist IP",
      "Support 24/7",
    ],
    highlighted: true,
  },
];

const settingSchema = new Schema<ISetting, SettingModel>(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    siteName: { type: String, default: "Topinz API" },
    siteDescription: { type: String, default: "Simple, fast and reliable REST API platform." },
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    pricing: { type: [pricingPlanSchema], default: () => DEFAULT_PRICING },
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

settingSchema.static("getMain", async function getMain(): Promise<SettingDocument> {
  const existing = await this.findOne({ key: "main" });
  if (existing) return existing;
  return this.create({ key: "main" });
});

export const Setting = mongoose.model<ISetting, SettingModel>("Setting", settingSchema);
