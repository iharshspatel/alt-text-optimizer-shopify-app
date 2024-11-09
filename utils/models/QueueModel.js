import mongoose from "mongoose";

const ProductLogSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  attempts: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Queue = mongoose.model("Queue", ProductLogSchema);

export default Queue;
