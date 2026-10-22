import mongoose from "mongoose";
const { Schema } = mongoose;
export const Birthday = mongoose.model(
  "Birthday",
  new Schema(
    {
      _id: { type: String, default: "birthday" },
      draft: { type: Schema.Types.Mixed, required: true },
      published: { type: Schema.Types.Mixed, required: true },
      revision: { type: Number, default: 0 },
      publishedAt: Date,
    },
    { timestamps: true },
  ),
);
export const Admin = mongoose.model(
  "Admin",
  new Schema(
    {
      email: { type: String, unique: true, required: true },
      passwordHash: { type: String, required: true },
    },
    { timestamps: true },
  ),
);
export const Session = mongoose.model(
  "Session",
  new Schema(
    {
      tokenHash: { type: String, unique: true, required: true },
      adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
      expiresAt: { type: Date, index: { expires: 0 } },
    },
    { timestamps: true },
  ),
);
export const Media = mongoose.model(
  "Media",
  new Schema(
    {
      kind: { type: String, enum: ["image", "audio"], required: true },
      publicId: { type: String, required: true },
      thumbnailId: String,
      format: { type: String, required: true },
      resourceType: { type: String, enum: ["image", "video"], required: true },
      originalName: String,
      bytes: Number,
    },
    { timestamps: true },
  ),
);
export async function connectDatabase(uri) {
  if (!uri)
    throw new Error(
      "MONGODB_URI is required. Copy server/.env.example to server/.env and configure MongoDB.",
    );
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([Admin.init(), Session.init()]);
}
