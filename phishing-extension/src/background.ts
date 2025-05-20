// import { initialize } from "./phishingDetector/initializeModel";
import {
  isPhishingSiteByDom,
  isPhishingSiteProbByUrl,
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
      case MessageType.CHECK_PHISHING_BY_URL:
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.title?.toLowerCase() == "security error") {
            // console.log("Security error page detected, skipping phishing check.");
            notifyContentScriptAndPopup({
              type: MessageType.PHISHING_STATUS_UPDATED,
              phishingStatus: PhishingStatus.PHISHING,
            });
            sendResponse({ phishingStatus: PhishingStatus.PHISHING });
            return;
          }
        });
        if (!message.urlFeatures) {
          // console.error("URL is required to check for phishing.");
          sendResponse({ PhishingStatus: PhishingStatus.ERROR });
          return;
        }

        const isPhishingSiteProb = isPhishingSiteProbByUrl(message.urlFeatures)
        const status = isPhishingSiteProb < 0.06 ? PhishingStatus.LEGITIMATE : 
        (isPhishingSiteProb > 0.5 ? PhishingStatus.PHISHING : PhishingStatus.DEEPER_ANALISIS_REQIRED);
        notifyContentScriptAndPopup({
          type: MessageType.PHISHING_STATUS_UPDATED,
          phishingStatus: status,
        });
        // console.log("Phishing status updated:", isPhis);
        sendResponse({ phishingStatus: status });
        break;
      case MessageType.CHECK_PHISHING_BY_DOM:
        if (!message.domFeatures) {
        // console.error("DOM is required to check for phishing.");
        sendResponse({ PhishingStatus: PhishingStatus.LEGITIMATE }); // AS it's called only if the URL prob below 0.5
        return;
        }

        const isPhis = isPhishingSiteByDom(message.domFeatures);
        const phishStatus = isPhis ? PhishingStatus.PHISHING : PhishingStatus.LEGITIMATE;
        
        // console.log("Phishing status updated:", isPhis);
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
      case MessageType.GET_PHISHING_STATUS:
        // console.log("Extension initialized");
        break;
      case MessageType.PHISHING_STATUS_UPDATED:
        // console.log("Phishing status updated:", message.phishingStatus);
        break;
      case MessageType.TEST:
        const data = message.data;
        console.log("Received data for testing:", data);
        // fetch('http://127.0.0.1:6543/verdict',{
        //   method : 'POST',
        //   body : JSON.stringify(data)
        // })
        break;
      default:
        console.error("Unknown message type:", message.type);
        break;
    }
    return true;
  }
);
