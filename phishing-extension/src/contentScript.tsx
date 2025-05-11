import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { Message, MessageType } from './types/message.types';
import { StorageKey } from './types/storage.types';
import { PhishingStatus } from './types/state.type';
import { extractDOMFeatures } from './phishingDetector/domFeaturesExtractor';
import { extractUrlFeatures } from './phishingDetector/urlFeaturesExtractor';

let phishingStatus: PhishingStatus = PhishingStatus.PROCESSING;
let bannerState = false;

function checkPhishing(urlFeatures: number[], setPhishingStateCallback: React.Dispatch<React.SetStateAction<PhishingStatus>>) {
    chrome.runtime.sendMessage(
        { type: MessageType.FETCH_HTML, url: window.location.href },
        (response) => {
            if (!response?.html) {
                console.error('Failed to fetch HTML for phishing check:', response?.error);
                setPhishingStateCallback(PhishingStatus.ERROR);
                return;
            }

            const domFeatures = extractDOMFeatures(response.html, window.location.hostname);

            chrome.runtime.sendMessage(
                {
                    type: MessageType.CHECK_PHISHING,
                    domFeatures,
                    urlFeatures,
                },
                (response) => {
                    console.log('Got phishing check response:', response);
                    phishingStatus = response.phishingStatus;
                    setPhishingStateCallback(phishingStatus);
                }
            );
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
        const [returnedElement, setReturnedElement] = useState<React.ReactElement>(<></>);

        useEffect(() => {
            const handleRuntimeMessages = (message: Message) => {
                if (message.type === MessageType.TOGGLE_BANNER) {
                    if (typeof message.enableBanner === 'boolean') {
                        bannerState = message.enableBanner;
                        setIsBannerEnabled(bannerState);
                    }
                }
                if (message.type === MessageType.PHISHING_STATUS_UPDATED) {
                    if (typeof message.phishingStatus === 'number') {
                        phishingStatus = message.phishingStatus;
                        setPhishingState(message.phishingStatus);
                    }
                }
            };


            chrome.runtime.onMessage.addListener(handleRuntimeMessages);

            chrome.storage.local.get(StorageKey.BANNER_ENABLED, (result) => {
                const bannerStatus = result[StorageKey.BANNER_ENABLED];
                if (bannerStatus !== undefined) {
                    setIsBannerEnabled(bannerStatus);
                }
            });

            // Check legitimacy first, before DOM is ready
            const urlFeatures = extractUrlFeatures(window.location.href);
            checkPhishing(urlFeatures, setPhishingState);

            return () => chrome.runtime.onMessage.removeListener(handleRuntimeMessages);
        }, []);

        useEffect(() => {
            if (isBannerEnabled) {
                setReturnedElement(<Banner phishingState={phishingState} />);
                if (document.body) document.body.style.marginTop = '50px';
            } else {
                setReturnedElement(<></>);
                if (document.body) document.body.style.marginTop = '0px';
            }
        }, [isBannerEnabled, phishingState]);

        return returnedElement;
    };

    ReactDOM.createRoot(mount).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Respond to popup request for current phishing status
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    if (message.type === MessageType.GET_PHISHING_STATUS) {
        sendResponse({ phishingStatus });
    }
});

mountApp();
