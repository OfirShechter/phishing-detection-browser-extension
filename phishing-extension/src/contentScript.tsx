import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { Message, MessageType } from './types/message.types';
import { StorageKey } from './types/storage.types';
import { PhishingStatus } from './types/state.type';
import { extractDOMFeatures } from './phishingDetector/domFeaturesExtractor';

// import { isModelReady } from './phishingDetector/initializeModel';

let phishingStatus: PhishingStatus = PhishingStatus.PROCESSING; // Store phishing state in memory
let bannerState = false; // Store banner enabled state in memory

function updatePhishingStatus(setPhishingStateCallback: React.Dispatch<React.SetStateAction<PhishingStatus>>) {
    console.log('Checking phishing status for URL:', window.location.href);
    const domFeatures = extractDOMFeatures();

    chrome.runtime.sendMessage(
        {
            type: MessageType.CHECK_PHISHING,
            url: window.location.href,
            domFeatures: domFeatures
        },
        (response) => {
            console.log('got response from background script', response)
            phishingStatus = response.phishingStatus
            setPhishingStateCallback(phishingStatus);
        }
    );
}

const mountApp = () => {
    const mount = document.createElement('div');
    mount.id = 'phishing-banner-root';
    document.documentElement.appendChild(mount); // Append to <html>


    const App = () => {
        console.log('Running content script...')
        const [phishingState, setPhishingState] = useState<PhishingStatus>(PhishingStatus.PROCESSING);
        const [isBannerEnabled, setIsBannerEnabled] = useState<boolean>(false);
        const [returnedElement, setReturnedElement] = useState<React.ReactElement>(<></>);

        useEffect(() => {
            // chrome.storage.local.get("isInitialized", (result) => {
            //     if (result.isInitialized == true) {
            //         updatePhishingStatus(setPhishingState);
            //     };
            // });
            updatePhishingStatus(setPhishingState)
            // if (isModelReady()) {
            //     updatePhishingStatus(setPhishingState);
            // }

            // Listen for updates
            chrome.runtime.onMessage.addListener((message) => {
                if (message.type === MessageType.TOGGLE_BANNER) {
                    bannerState = message.enableBanner;
                    setIsBannerEnabled(bannerState);
                }
                if (message.type === MessageType.PHISHING_STATUS_UPDATED) {
                    phishingStatus = message.phishingStatus;
                    setPhishingState(message.phishingStatus);
                }
            });

            chrome.storage.local.get(StorageKey.BANNER_ENABLED, (result) => {
                const bannerStatus = result[StorageKey.BANNER_ENABLED];
                if (bannerStatus !== undefined) {
                    setIsBannerEnabled(bannerStatus);
                }
            });
        }, []);

        useEffect(() => {
            console.log('isPhishing', phishingState)
            if (isBannerEnabled) {
                setReturnedElement(<Banner phishingState={phishingState} />);
                if (document.body) {
                    document.body.style.marginTop = '50px';
                }
            } else {
                setReturnedElement(<></>);
                if (document.body) {
                    document.body.style.marginTop = '0px';
                }
            }
        }, [isBannerEnabled, phishingState, document.body])

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
        console.log('got event GET_PHISHING_STATUS at content script, sending response:', {phishingStatus})
        sendResponse({ phishingStatus: phishingStatus });
    }
});


mountApp();
