import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { Message, MessageType } from './types/message';

let phishingState: boolean | null = null; // Store phishing state in memory


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

        useEffect(() => {
            setIsPhishing(phishingState);

            document.body.style.paddingTop = '50px'; // Match the banner height
            return () => {
                document.body.style.paddingTop = ''; // Reset padding on unmount
            };
        }, [phishingState]);

        return <Banner isPhishing={isPhishing} />;
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