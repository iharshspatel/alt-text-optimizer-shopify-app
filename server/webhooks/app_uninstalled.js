import SessionModel from "../../utils/models/sessionModel.js";
import StoreModel from "../../utils/models/storeModel.js";

/**
 * @typedef { import("../../_developer/types/2024-07/webhooks.js").APP_UNINSTALLED } webhookTopic
 */

const appUninstallHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);
  await StoreModel.findOneAndUpdate({ shop }, { isActive: false });
  await SessionModel.deleteMany({ shop });
};

export default appUninstallHandler;
