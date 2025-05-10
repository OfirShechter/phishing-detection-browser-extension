import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { Message, MessageType } from './types/message.types';
import { StorageKey } from './types/storage.types';
import { PhishingStatus } from './types/state.type';
import { extractDOMFeatures } from './phishingDetector/domFeaturesExtractor';

let phishingStatus: PhishingStatus = PhishingStatus.PROCESSING;
let bannerState = false;

function checkPhishing(setPhishingStateCallback: React.Dispatch<React.SetStateAction<PhishingStatus>>) {
    console.log('Checking phishing status (URL + DOM):', window.location.href);
    chrome.runtime.sendMessage(
        {
            type: MessageType.CHECK_PHISHING,
            domFeatures: extractDOMFeatures(),
            url: window.location.href,
        },
        (response) => {
            console.log('Got phishing check response:', response);
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
            chrome.runtime.sendMessage(
                {
                    type: MessageType.CHECK_LEGITIMATE_BY_URL,
                    url: window.location.href,
                },
                (response) => {
                    phishingStatus = response.phishingStatus;
                    setPhishingState(response.phishingStatus);
                }
            );

            const tryRunPhishingCheckWhenReady = () => {
                if (document.readyState === 'complete') {
                    // Abort earlier URL-only check if needed
                    chrome.runtime.sendMessage({ type: MessageType.ABORT_CHECK_LEGITIMATE_BY_URL }, () => {});
                    checkPhishing(setPhishingState);
                } else {
                    window.addEventListener('load', () => {
                        chrome.runtime.sendMessage({ type: MessageType.ABORT_CHECK_LEGITIMATE_BY_URL }, () => {});
                        checkPhishing(setPhishingState);
                    });
                }
            };

            tryRunPhishingCheckWhenReady();

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
