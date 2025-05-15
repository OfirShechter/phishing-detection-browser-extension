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
      case MessageType.CHECK_PHISHING:
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.title?.toLowerCase() == "security error") {
              console.log("Security error page detected, skipping phishing check.");
              notifyContentScriptAndPopup({
                type: MessageType.PHISHING_STATUS_UPDATED,
                phishingStatus: PhishingStatus.PHISHING,
              });    
              sendResponse({ phishingStatus: PhishingStatus.PHISHING });
              return;
            }
          });
          if (!message.urlFeatures) {
            console.error("URL is required to check for phishing.");
            sendResponse({ PhishingStatus: PhishingStatus.ERROR });
            return;
          }
          console.log("Checking phishing status for URL: ", message.url);
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
        case MessageType.FETCH_HTML:
            if (!message.url) {
                console.error("No URL provided for FETCH_HTML");
                sendResponse({ html: null, error: "Missing URL" });
                return;
            }
            fetch(message.url)
                .then((res) => res.text())
                .then((html) => {
                    sendResponse({ html });
                })
                .catch((err) => {
                    console.error("Failed to fetch HTML:", err);
                    sendResponse({ html: null, error: err.toString() });
                });
            break;
      default:
        console.error("Unknown message type:", message.type);
        break;
    }
    return true;
  }
);
