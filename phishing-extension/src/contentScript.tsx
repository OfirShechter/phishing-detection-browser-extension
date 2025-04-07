import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { Message, MessageType } from './types/message.types';
import { StorageKey } from './types/storage.types';

let phishingState: boolean | null = null; // Store phishing state in memory
let bannerState = false; // Store banner enabled state in memory

// Send the CHECK_PHISHING message at document_start
chrome.runtime.sendMessage(
    { type: MessageType.CHECK_PHISHING, url: window.location.href },
    (response) => {
        phishingState = response.isPhishing;
    }
);



const mountApp = () => {
    const mount = document.createElement('div');
    mount.id = 'phishing-banner-root';
    // mount.style.position = 'fixed';
    // mount.style.top = '0';
    // mount.style.left = '0';
    // mount.style.width = '100%';
    // mount.style.zIndex = '9999';
    document.documentElement.appendChild(mount); // Append to <html>


    const App = () => {
        const [isPhishing, setIsPhishing] = useState<boolean | null>(null);
        const [isBannerEnabled, setIsBannerEnabled] = useState<boolean>(false);
        const [returnedElement, setReturnedElement] = useState<React.ReactElement>(<></>);

        useEffect(() => {
            setIsPhishing(phishingState);

            // Listen for toggle updates
            chrome.runtime.onMessage.addListener((message) => {
                if (message.type === MessageType.TOGGLE_BANNER) {
                    bannerState = message.enableBanner;
                    setIsBannerEnabled(bannerState);
                }
                if (message.type === MessageType.PHISHING_STATUS_UPDATED) {
                    phishingState = message.isPhishing;
                    setIsPhishing(phishingState);
                }
            });

            chrome.storage.local.get(StorageKey.BANNER_ENABLED, (result) => {
                const bannerStatus = result[StorageKey.BANNER_ENABLED];
                if (bannerStatus !== undefined) {
                    setIsBannerEnabled(bannerStatus);
                }
            });
        }, [phishingState, bannerState]);

        useEffect(() => {
            setReturnedElement(isBannerEnabled ? <Banner isPhishing={isPhishing} /> : <></>);
        }, [isBannerEnabled, isPhishing])

        return returnedElement
    };

    ReactDOM.createRoot(mount).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Respond to messages from the popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    if (message.type === MessageType.GET_PHISHING_STATUS) {
        sendResponse({ isPhishing: phishingState });
    }
});


mountApp();
