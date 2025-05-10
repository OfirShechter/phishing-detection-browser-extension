// import { initialize } from "./phishingDetector/initializeModel";
import {
  isPhishingSiteByDom,
  isSiteLegitimateByUrl,
} from "./phishingDetector/phishingDetector";
import { Message, MessageType } from "./types/message.types";
import { PhishingStatus } from "./types/state.type";
import { StorageKey } from "./types/storage.types";

function notifyContentScriptActiveTab(message: Message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}

function notifyContentScriptAndPopup(message: Message) {
  notifyContentScriptActiveTab(message);
  chrome.runtime.sendMessage(message);
}

let currentLegitimacyCheckController: AbortController | null = null;

// chrome.runtime.onInstalled.addListener(async () => {
//   await initialize();
//   chrome.storage.local.set({ isInitialized: true });
//   notifyContentScriptAndPopup({type: MessageType.EXTENTION_INITIALIZED});
// });

// (async function init() {
//   await initialize();
//   chrome.storage.local.set({ isInitialized: true });
//   notifyContentScriptAndPopup({type: MessageType.EXTENTION_INITIALIZED});
// })();

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    console.log("Received message:", message);
    switch (message.type) {
      case MessageType.TOGGLE_BANNER:
        const isEnabled = message.enableBanner;
        chrome.storage.local.set({ [StorageKey.BANNER_ENABLED]: isEnabled });
        notifyContentScriptActiveTab({
          type: MessageType.TOGGLE_BANNER,
          enableBanner: message.enableBanner,
        });
        break;
      case MessageType.ABORT_CHECK_LEGITIMATE_BY_URL:
        if (currentLegitimacyCheckController) {
          currentLegitimacyCheckController.abort();
          currentLegitimacyCheckController = null;
        }
        sendResponse({ success: true });
        break;
      case MessageType.CHECK_LEGITIMATE_BY_URL:
        if (!message.url) {
          console.error("URL is required to check for phishing.");
          sendResponse({ PhishingStatus: PhishingStatus.ERROR });
          return;
        }
        // Abort previous one if still active
        if (currentLegitimacyCheckController) {
          currentLegitimacyCheckController.abort();
        }

        currentLegitimacyCheckController = new AbortController();

        const isLegitimate = isSiteLegitimateByUrl(
          message.url,
          currentLegitimacyCheckController.signal
        );
        const legitimacyStatus = isLegitimate
          ? PhishingStatus.LEGITIMATE
          : PhishingStatus.PROCESSING; // if not true more processing is needed
        notifyContentScriptAndPopup({
          type: MessageType.PHISHING_STATUS_UPDATED,
          phishingStatus: legitimacyStatus,
        });
        console.log("Legitimacy status updated:", isLegitimate);
        sendResponse({ phishingStatus: legitimacyStatus });
        break;
      case MessageType.CHECK_PHISHING_BY_DOM:
        if (!message.domFeatures) {
          console.error("DOM is required to check for phishing.");
          sendResponse({ PhishingStatus: PhishingStatus.ERROR });
          return;
        }
        const isPhishing = isPhishingSiteByDom(message.domFeatures);
        const phishingStatus = isPhishing
          ? PhishingStatus.PHISHING
          : PhishingStatus.LEGITIMATE;
        notifyContentScriptAndPopup({
          type: MessageType.PHISHING_STATUS_UPDATED,
          phishingStatus,
        });
        console.log("Phishing status updated:", isPhishing);
        sendResponse({ phishingStatus });
        break;
      default:
        console.error("Unknown message type:", message.type);
        break;
    }
    return true;
  }
);
