import mongoose from "mongoose";

const TemplateSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  template: { type: String, required: true },
  inprogress: { type: Boolean, require: true, default: false },
});

const TemplateModel = mongoose.model("Alt_Templates", TemplateSchema);

export default TemplateModel;
