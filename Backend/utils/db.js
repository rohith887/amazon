import mongoose from "mongoose";
import "dotenv/config";

const URI = process.env.DB_URI ?? "mongodb://127.0.0.1:27017/grassroots_crm";

export async function connectDb() {
  await mongoose.connect(URI);
  console.log(`[db] connected: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
}

export default mongoose;
