import { isPhishingSite } from "./phishingDetector/phishingDetector";
import { Message, MessageType } from "./types/message.types";
import { StorageKey } from "./types/storage.types";

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    switch (message.type) {
      case MessageType.TOGGLE_BANNER:
        const isEnabled = message.enableBanner;
        chrome.storage.local.set({ [StorageKey.BANNER_ENABLED]: isEnabled });

        // Notify all tabs about the change
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            tabs.forEach((tab) => {
                if (tab.id) {
                    console.log("Sending message to tab:", tab.id, "with banner state:", isEnabled);
                    chrome.tabs.sendMessage(tab.id, { type: MessageType.TOGGLE_BANNER, enableBanner: message.enableBanner });
                }
            });
        });
        break;
      case MessageType.CHECK_PHISHING:
        const isPhishing = isPhishingSite();
        sendResponse({ isPhishing });
        break;
      default:
        console.error("Unknown message type:", message.type);
        break;
    }
    return true;
  }
);
