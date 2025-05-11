// import { initialize } from "./phishingDetector/initializeModel";
import {
  isPhishingSite,
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
      case MessageType.CHECK_PHISHING:
          if (!message.domFeatures || !message.urlFeatures) {
            console.error("URL and DOM are required to check for phishing.");
            sendResponse({ PhishingStatus: PhishingStatus.ERROR });
            return;
          }
          const isPhis = isPhishingSite(message.urlFeatures, message.domFeatures);
          const phishStatus = isPhis
            ? PhishingStatus.PHISHING
            : PhishingStatus.LEGITIMATE;
          notifyContentScriptAndPopup({
            type: MessageType.PHISHING_STATUS_UPDATED,
            phishingStatus: phishStatus,
          });
          console.log("Phishing status updated:", isPhis);
          sendResponse({ phishingStatus: phishStatus });
          break;
      default:
        console.error("Unknown message type:", message.type);
        break;
    }
    return true;
  }
);
