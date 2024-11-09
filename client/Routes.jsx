import React from "react";
import Index from "./pages/Index";
import BillingAPI from "./pages/debug/Billing";
import GetData from "./pages/debug/Data";
import DebugIndex from "./pages/debug/Index";
import ActiveWebhooks from "./pages/debug/Webhooks";
import LogsAndBackup from "./pages/logsAndBackup";

const routes = {
  "/": () => <Index />,
  "/logs-and-backup": () => <LogsAndBackup />,
  "/debug": () => <DebugIndex />,
  "/debug/webhooks": () => <ActiveWebhooks />,
  "/debug/billing": () => <BillingAPI />,
  "/debug/data": () => <GetData />,
};

export default routes;
