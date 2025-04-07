import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { MessageType } from './types/message';

// Send the CHECK_PHISHING message at document_start
chrome.runtime.sendMessage(
    { type: MessageType.CHECK_PHISHING, url: window.location.href },
    (response) => {
        console.log('Phishing status sent at document_start:', response);
    }
);

const mountApp = () => {
    const mount = document.createElement('div');
    document.body.prepend(mount);

    const App = () => {
        const [isPhishing, setIsPhishing] = useState<boolean | null>(null);
        
        useEffect(() => {
            document.body.style.paddingTop = '50px'; // Match the banner height
            return () => {
                document.body.style.paddingTop = ''; // Reset padding on unmount
            };
        }, []);

        if (isPhishing === null) {
            chrome.storage.local.get('phishingStatus', (result) => {
                if (result.phishingStatus) {
                    setIsPhishing(result.phishingStatus.isPhishing);
                }
            });
        }

        return <Banner isPhishing={isPhishing} />;
    };

    ReactDOM.createRoot(mount).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Ensure the DOM is ready before mounting the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}