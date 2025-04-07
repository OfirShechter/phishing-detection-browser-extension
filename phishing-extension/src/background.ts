import { isPhishingSite } from "./phishingDetector/phishingDetector";
import { Message, MessageType } from "./types/message";

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    if (message.type === MessageType.CHECK_PHISHING) {
        const url = message.url;

        const isPhishing = isPhishingSite();
        console.log(`Checking URL: ${url}, Phishing: ${isPhishing}`);

        chrome.storage.local.set({ phishingStatus: { url, isPhishing } });

        sendResponse({ isPhishing });
    }

    return true;
});