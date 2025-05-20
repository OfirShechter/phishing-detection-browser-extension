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

type CheckPhishingResult = {
    isPhishing: boolean;
};

function checkPhishing(urlFeatures: number[], setPhishingStateCallback: React.Dispatch<React.SetStateAction<PhishingStatus>>): Promise<CheckPhishingResult> {
    // ✅ Immediately broadcast "PROCESSING" to popup
    phishingStatus = PhishingStatus.PROCESSING;
    setPhishingStateCallback(phishingStatus);
    chrome.runtime.sendMessage({
        type: MessageType.PHISHING_STATUS_UPDATED,
        phishingStatus: phishingStatus,
    });

    // Start fetching HTML immediately
    const htmlPromise = new Promise<PhishingStatus>((resolve) => {
        chrome.runtime.sendMessage(
            { type: MessageType.FETCH_HTML, url: window.location.href },
            (response) => {
                if (!response?.html) {
                    console.error('Failed to fetch HTML for phishing check:', response?.error);
                    resolve(PhishingStatus.LEGITIMATE); // most likely a legitimate site- url analysis below 0.5
                }
                const domFeatures = extractDOMFeatures(response.html, window.location.hostname);

                chrome.runtime.sendMessage(
                    {
                        type: MessageType.CHECK_PHISHING_BY_DOM,
                        domFeatures,
                        url: window.location.hostname,
                    },
                    (response) => {
                        // console.log('Follow-up phishing check with DOM features:', response);
                        const phishingStat = response.phishingStatus;
                        resolve(phishingStat);
                    }
                );
            }
        );
    });

    // Send an immediate check with null DOM features
    const promiseResult = new Promise<CheckPhishingResult>((resolve) => {
        chrome.runtime.sendMessage(
            {
                type: MessageType.CHECK_PHISHING_BY_URL,
                urlFeatures,
                url: window.location.hostname,
            },
            async (response) => {
                // console.log('Initial phishing check response (no DOM features):', response);
                phishingStatus = response.phishingStatus;

                if (phishingStatus === PhishingStatus.DEEPER_ANALISIS_REQIRED) {
                    phishingStatus = await htmlPromise;
                }

                chrome.runtime.sendMessage({
                    type: MessageType.PHISHING_STATUS_UPDATED,
                    phishingStatus: phishingStatus,
                });
                setPhishingStateCallback(phishingStatus);
                resolve({ isPhishing: phishingStatus === PhishingStatus.PHISHING });
            }
        );
    });

    return promiseResult;
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
            measureHeapAndTime(checkPhishing, urlFeatures, setPhishingState).then((result) => {
                const data = {
                    'url': window.location.href,
                    'groupId': 7,
                    'isPhishing': result.functionOutput?.isPhishing,
                    'responseTimeMs': result.timeMs,
                    'heapChangeBytes': result.heapChangeBytes
                };
                chrome.runtime.sendMessage({
                    type: 'TEST', // send a message to the background with the `data` object
                    data: data,
                });
            }
            );

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

// ####################### requested testing utils #######################
async function measureHeapAndTime<T extends any[], R>(
    fn: (...args: T) => Promise<R> | R,
    ...args: T
): Promise<{
    functionOutput: R | undefined;
    error: unknown;
    heapChangeBytes: number;
    timeMs: number;
    heapBefore: number;
    heapAfter: number;
}> {
    const perfMemory = (performance as any).memory;

    if (!window.performance || !perfMemory) {
        throw new Error("performance.memory API not available. Must be run in Chrome Extension context.");
    }
    // Record initial heap stats
    const startHeap = perfMemory.usedJSHeapSize;
    const startTime = performance.now();

    // Run the function (supports async)
    let functionOutput, error = null;

    try {
        functionOutput = await fn(...args);
    } catch (e) {
        error = e;
    }

    const endTime = performance.now();
    const endHeap = perfMemory.usedJSHeapSize;

    const heapDelta = endHeap - startHeap;
    const timeMs = endTime - startTime;



    return {
        functionOutput,
        error,
        heapChangeBytes: heapDelta,
        timeMs,
        heapBefore: startHeap,
        heapAfter: endHeap
    };
}

