import mongoose from "mongoose";

const lobSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true, collection: "lobs" },
);

export default mongoose.model("Lob", lobSchema);
