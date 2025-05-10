import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { Message, MessageType } from './types/message.types';
import { StorageKey } from './types/storage.types';
import { PhishingStatus } from './types/state.type';
import { safeExtractDOMFeatures } from './phishingDetector/domFeaturesExtractor';

let phishingStatus: PhishingStatus = PhishingStatus.PROCESSING;
let bannerState = false;

function updatePhishingStatus(setPhishingStateCallback: React.Dispatch<React.SetStateAction<PhishingStatus>>) {
    console.log('Checking phishing status for URL:', window.location.href);
    const features = safeExtractDOMFeatures();

    chrome.runtime.sendMessage(
        {
            type: MessageType.CHECK_PHISHING,
            url: window.location.href,
            domFeatures: features
        },
        (response) => {
            console.log('Got response from background script', response);
            phishingStatus = response.phishingStatus;
            setPhishingStateCallback(phishingStatus);
        }
    );
}

const mountApp = () => {
    const mount = document.createElement('div');
    mount.id = 'phishing-banner-root';
    document.documentElement.appendChild(mount);

    const App = () => {
        const [phishingState, setPhishingState] = useState<PhishingStatus>(PhishingStatus.PROCESSING);
        const [isBannerEnabled, setIsBannerEnabled] = useState<boolean>(false);

        useEffect(() => {
            const runFeatureExtraction = () => updatePhishingStatus(setPhishingState);

            if (document.readyState === 'complete') {
                runFeatureExtraction();
            } else {
                window.addEventListener('load', runFeatureExtraction, { once: true });
            }

            const listener = (message: Message) => {
                if (message.type === MessageType.TOGGLE_BANNER && typeof message.enableBanner === 'boolean') {
                    bannerState = message.enableBanner;
                    setIsBannerEnabled(bannerState);
                }
                if (message.type === MessageType.PHISHING_STATUS_UPDATED && message.phishingStatus !== undefined) {
                    phishingStatus = message.phishingStatus;
                    setPhishingState(phishingStatus);
                }
            };


            chrome.runtime.onMessage.addListener(listener);

            chrome.storage.local.get(StorageKey.BANNER_ENABLED, (result) => {
                const bannerStatus = result[StorageKey.BANNER_ENABLED];
                if (bannerStatus !== undefined) {
                    setIsBannerEnabled(bannerStatus);
                }
            });

            return () => {
                chrome.runtime.onMessage.removeListener(listener);
            };
        }, []);

        useEffect(() => {
            if (document.body) {
                document.body.style.marginTop = isBannerEnabled ? '50px' : '0px';
            }
        }, [isBannerEnabled]);

        return isBannerEnabled ? <Banner phishingState={phishingState} /> : <></>;
    };

    ReactDOM.createRoot(mount).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Respond to popup queries for current phishing status
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    if (message.type === MessageType.GET_PHISHING_STATUS) {
        console.log('GET_PHISHING_STATUS received, responding:', { phishingStatus });
        sendResponse({ phishingStatus });
    }
});

mountApp();
