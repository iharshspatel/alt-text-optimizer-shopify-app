import mongoose from "mongoose";

const ProductLogSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  productId: { type: String, required: true },
  mediaId: { type: String, required: true },
  oldAltText: { type: String },
  newAltText: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const ProductLog = mongoose.model("ProductLog", ProductLogSchema);

export default ProductLog;
