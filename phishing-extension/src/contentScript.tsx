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

// Listen for toggle updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MessageType.TOGGLE_BANNER) {
        console.log('Banner toggle message received:', message.enableBanner);
        bannerState = message.enableBanner;
    }
});

const mountApp = () => {
    const mount = document.createElement('div');
    document.body.prepend(mount);

    const App = () => {
        const [isPhishing, setIsPhishing] = useState<boolean | null>(null);
        const [isBannerEnabled, setIsBannerEnabled] = useState<boolean>(bannerState);

        useEffect(() => {
            setIsPhishing(phishingState);

            chrome.storage.local.get(StorageKey.BANNER_ENABLED, (result) => {
                const bannerStatus = result[StorageKey.BANNER_ENABLED];
                console.log('Banner status from storage:', bannerStatus);
                if (bannerStatus !== undefined) {
                    setIsBannerEnabled(bannerStatus);
                }
            });

            document.body.style.paddingTop = isBannerEnabled ? '50px' : ''; // Match the banner height
            return () => {
                document.body.style.paddingTop = ''; // Reset padding on unmount
            };
        }, [phishingState, bannerState]);

        return isBannerEnabled ? <Banner isPhishing={isPhishing} /> : <></>
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

// Ensure the DOM is ready before mounting the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}