import { useSyncExternalStore } from "react";

const IN_APP_KEY = "bf_in_app";
const TRACKING_KEY = "bf_tracking";
const SERVER_SHELL = { ready: false, inApp: false, trackingOn: false, isAndroid: false };

let clientShell = null;

function rememberAppParams(params) {
  try {
    if (params.get("source") === "twa") sessionStorage.setItem(IN_APP_KEY, "1");
    const tracking = params.get("tracking");
    if (tracking) sessionStorage.setItem(TRACKING_KEY, tracking);
    return {
      inApp: sessionStorage.getItem(IN_APP_KEY) === "1",
      trackingOn: sessionStorage.getItem(TRACKING_KEY) === "on",
    };
  } catch {
    return {
      inApp: params.get("source") === "twa",
      trackingOn: params.get("tracking") === "on",
    };
  }
}

function getClientShell() {
  if (!clientShell) {
    clientShell = {
      ready: true,
      isAndroid: /Android/i.test(window.navigator.userAgent),
      ...rememberAppParams(new URLSearchParams(window.location.search)),
    };
  }
  return clientShell;
}

const subscribe = () => () => {};

export function useAppShell() {
  return useSyncExternalStore(subscribe, getClientShell, () => SERVER_SHELL);
}
