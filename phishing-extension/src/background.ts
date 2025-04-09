import { initialize } from "./phishingDetector/initializeModel";
import { isPhishingSite } from "./phishingDetector/phishingDetector";
import { Message, MessageType } from "./types/message.types";
import { StorageKey } from "./types/storage.types";

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    switch (message.type) {
      case MessageType.TOGGLE_BANNER:
        const isEnabled = message.enableBanner;
        chrome.storage.local.set({ [StorageKey.BANNER_ENABLED]: isEnabled });

        // Notify current tab about the change
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: MessageType.TOGGLE_BANNER,
              enableBanner: message.enableBanner,
            });
          }
        });
        break;
      case MessageType.CHECK_PHISHING:
        if (!message.url) {
          console.error("URL is required to check for phishing.");
          sendResponse({ isPhishing: false });
          return;
        }
        const isPhishing = isPhishingSite(message.url);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: MessageType.PHISHING_STATUS_UPDATED,
              isPhishing: isPhishing,
            });
          }
        });
        sendResponse({ isPhishing });
        break;
      default:
        console.error("Unknown message type:", message.type);
        break;
    }
    return true;
  }
);

async function main() {
  try {
      await initialize(); // Load data at the start
  } catch (error) {
      console.error("Error initializing:", error);
  }
}

main();