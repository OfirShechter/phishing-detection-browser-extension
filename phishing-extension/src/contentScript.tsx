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
    document.body.prepend(mount);

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
            });

            chrome.storage.local.get(StorageKey.BANNER_ENABLED, (result) => {
                const bannerStatus = result[StorageKey.BANNER_ENABLED];
                if (bannerStatus !== undefined) {
                    setIsBannerEnabled(bannerStatus);
                }
            });
        }, [phishingState, bannerState]);

        useEffect(() => {
            document.body.style.paddingTop = isBannerEnabled ? '50px' : ''; // Match the banner height
            setReturnedElement(isBannerEnabled ? <Banner isPhishing={isPhishing} /> : <></>);
            return () => {
                document.body.style.paddingTop = ''; // Reset padding on unmount
            };
        }, [isBannerEnabled])

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

// Ensure the DOM is ready before mounting the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}