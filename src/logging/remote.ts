/**
 * Ships mobile logs to `POST /v1/client-logs` (AGENTS.md §4).
 *
 * The endpoint requires a session, so uploads wait while nobody is signed in
 * and records stay queued (bounded) until someone is. Logs are flushed when
 * the app goes to the background.
 */
import { AppState } from "react-native";

import { authFetch, getAuthTokens } from "../api/client";
import { API_ROUTES } from "../api/routes.generated";
import { MOBILE_LOGGING } from "../constants";
import { getRecentMobileLogs, setMobileLogSink } from "./logger";
import { createLogShipper, type WireLogRecord } from "./shipper";

async function upload(records: WireLogRecord[]): Promise<boolean> {
  if (!getAuthTokens().accessToken) return false;
  const response = await authFetch(API_ROUTES.clientLogs, {
    method: "POST",
    body: JSON.stringify({ records }),
  });
  if (response.ok) return true;
  // The server can never accept this batch; drop it rather than retry forever.
  return [400, 413, 422].includes(response.status);
}

const shipper = createLogShipper(upload, MOBILE_LOGGING);

/** Start best-effort uploads; returns a teardown. */
export function startRemoteMobileLogging(): () => void {
  shipper.start(getRecentMobileLogs());
  setMobileLogSink(shipper.enqueue);
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "background") void shipper.flush();
  });
  return () => {
    subscription.remove();
    setMobileLogSink(null);
    shipper.stop();
  };
}
