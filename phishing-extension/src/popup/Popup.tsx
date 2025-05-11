import { useEffect, useState } from 'react';
import { MessageType } from '../types/message.types';
import { StorageKey } from '../types/storage.types';
import { PhishingStatus } from '../types/state.type';
import { phishingStatusText } from '../components/Banner';
import { extractDOMFeatures } from "../phishingDetector/domFeaturesExtractor.ts";
import { extractUrlFeatures } from '../phishingDetector/urlFeaturesExtractor.ts';

function setPhishingStatusFromActiveTab(setPhishingCallback: React.Dispatch<React.SetStateAction<PhishingStatus>>
) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { type: MessageType.GET_PHISHING_STATUS },
                (response) => {
                    console.log('got response from content script', response)
                    if (response) {
                        setPhishingCallback(response.phishingStatus)
                    }
                    else {
                        const url = tabs[0]?.url;
                        if (url) {
                            console.log('Checking phishing status for tab URL:', url);
                            chrome.runtime.sendMessage(
                                { type: MessageType.FETCH_HTML, url: window.location.href },
                                (response) => {
                                    if (!response?.html) {
                                        console.error('Failed to fetch HTML for phishing check:', response?.error);
                                        setPhishingCallback(PhishingStatus.ERROR);
                                        return;
                                    }
                                    chrome.runtime.sendMessage(
                                        {
                                            type: MessageType.CHECK_PHISHING,
                                            domFeatures: extractDOMFeatures(response.html, window.location.hostname),
                                            urlFeatures: extractUrlFeatures(url)
                                        },
                                        (response) => {
                                            setPhishingCallback(response.phishingStatus);
                                        }
                                    );
                                }
                            );
                        }
                    }
                }
            );
        }
    });
}
const Popup = () => {
    const [phishingState, setPhishingState] = useState<PhishingStatus>(PhishingStatus.EXTENSION_INITIALIZING);
    const [isBannerEnabled, setIsBannerEnabled] = useState<boolean>(false);

    console.log('Popup component rendered', phishingState, isBannerEnabled)
    useEffect(() => {
        setPhishingStatusFromActiveTab(setPhishingState)
        // Get the current banner toggle state from chrome.storage
        chrome.storage.local.get(StorageKey.BANNER_ENABLED, (result) => {
            const bannerEnabled = result[StorageKey.BANNER_ENABLED]
            if (bannerEnabled !== undefined) {
                setIsBannerEnabled(bannerEnabled);
            }
        });

        // Listen for updates
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === MessageType.PHISHING_STATUS_UPDATED) {
                console.log('got event PHISHING_STATUS_UPDATED at UI')
                setPhishingState(message.phishingStatus);
                console.log('isPhishing', phishingState)
            }
        });
    }, []);

    const toggleBanner = () => {
        const newState = !isBannerEnabled;
        setIsBannerEnabled(newState);

        // Send a message to the background script to update the toggle state
        chrome.runtime.sendMessage({ type: MessageType.TOGGLE_BANNER, enableBanner: newState });
    };

    const text = phishingStatusText[phishingState] || '❗ No status available ❗';

    return <div style={{ width: 300, padding: 20 }}>
        <h2>🔍 Phishing Status</h2>
        <h2>{text}</h2>
        <h3>🔧 Banner Settings</h3>
        <button onClick={toggleBanner} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            {isBannerEnabled ? 'Disable Banner' : 'Enable Banner'}
        </button>
    </div>;
};

export default Popup;